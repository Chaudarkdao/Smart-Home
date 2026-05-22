import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { getIotData } from "../../services/iotApi";
import { detectFaces, getFaceStatus } from "../../services/faceApi";

const CAPTURE_MS = 500;
const IOT_POLL_MS = 400;
/** 10s ÷ 0.5s = 20 lần chụp liên tiếp không có mặt (đặc tả bổ sung). */
const NO_FACE_STREAK_LIMIT = 20;
const NO_FACE_WINDOW_MS = NO_FACE_STREAK_LIMIT * CAPTURE_MS;

/** Chuyển bbox (pixel gốc của frame) sang vùng hiển thị khi video dùng object-fit: cover. */
function mapBboxToDisplay(bbox, videoW, videoH, displayW, displayH) {
  if (!bbox || bbox.length < 4 || !videoW || !videoH) return null;
  const [x1, y1, x2, y2] = bbox.map(Number);
  const videoAR = videoW / videoH;
  const displayAR = displayW / displayH;
  let scale;
  let offsetX = 0;
  let offsetY = 0;
  if (videoAR > displayAR) {
    scale = displayH / videoH;
    offsetX = (displayW - videoW * scale) / 2;
  } else {
    scale = displayW / videoW;
    offsetY = (displayH - videoH * scale) / 2;
  }
  return {
    x: x1 * scale + offsetX,
    y: y1 * scale + offsetY,
    w: Math.max(2, (x2 - x1) * scale),
    h: Math.max(2, (y2 - y1) * scale),
  };
}

function drawFaceBox(ctx, rect, face, index) {
  const recognized =
    face.recognized_name && face.recognized_name !== "unknown"
      ? face.recognized_name
      : null;
  const sim =
    face.similarity != null && !Number.isNaN(Number(face.similarity))
      ? Number(face.similarity)
      : null;
  const strokeColor = recognized ? "#22c55e" : "#f97316";
  const label = recognized || "Unknown";
  const simPart = sim != null ? ` ${(sim * 100).toFixed(0)}%` : "";
  const text = `${label}${simPart}`;

  const { x, y, w, h } = rect;

  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = strokeColor;
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 4;
  ctx.strokeRect(x, y, w, h);

  ctx.font = "bold 14px system-ui, sans-serif";
  const tw = ctx.measureText(text).width;
  const padX = 8;
  const labelH = 22;
  const labelY = y > labelH + 4 ? y - labelH - 2 : y + 2;

  ctx.fillStyle = strokeColor;
  ctx.fillRect(x, labelY, tw + padX * 2, labelH);
  ctx.fillStyle = "#0f172a";
  ctx.fillText(text, x + padX, labelY + 16);
  ctx.restore();
}

/** Vẽ video khớp object-fit: cover lên canvas hiển thị. */
function drawVideoCover(ctx, video, dw, dh) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return;
  const videoAR = vw / vh;
  const displayAR = dw / dh;
  let sx;
  let sy;
  let sw;
  let sh;
  if (videoAR > displayAR) {
    sh = vh;
    sw = vh * displayAR;
    sx = (vw - sw) / 2;
    sy = 0;
  } else {
    sw = vw;
    sh = vw / displayAR;
    sx = 0;
    sy = (vh - sh) / 2;
  }
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, dw, dh);
}

/** Ảnh JPEG gửi API. */
function videoToJpegFile(video) {
  const w = video.videoWidth || 640;
  const h = video.videoHeight || 480;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  ctx.drawImage(video, 0, 0, w, h);
  return new Promise((resolve) => {
    c.toBlob(
      (blob) => {
        if (!blob) resolve(null);
        else resolve(new File([blob], "frame.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.88
    );
  });
}

/** Chụp khung hiển thị + bbox → blob URL (ảnh cuối phiên nhận diện). */
function captureDisplaySnapshot(video, faces) {
  const dw = video.clientWidth || 640;
  const dh = video.clientHeight || 480;
  const nw = video.videoWidth;
  const nh = video.videoHeight;
  if (!nw || !nh) return Promise.resolve(null);

  const c = document.createElement("canvas");
  c.width = dw;
  c.height = dh;
  const ctx = c.getContext("2d");
  if (!ctx) return Promise.resolve(null);

  drawVideoCover(ctx, video, dw, dh);
  (faces || []).forEach((face, index) => {
    const rect = mapBboxToDisplay(face.bbox, nw, nh, dw, dh);
    if (rect) drawFaceBox(ctx, rect, face, index);
  });

  return new Promise((resolve) => {
    c.toBlob(
      (blob) => {
        if (!blob) resolve(null);
        else resolve(URL.createObjectURL(blob));
      },
      "image/jpeg",
      0.9
    );
  });
}

/**
 * AUTO GATE: auth=11 mở cam; auth=12 giữ cam (backend face_service đang xác minh).
 * Mỗi 0.5s gọi /api/face/detect — logic đếm 3 lần + auth 12/13/14 nằm trong face_service (main).
 * Frontend chỉ hiển thị bbox/banner; kết luận theo auth 13 (OK) / 14 (fail) từ IoT.
 */
const SCAN_AUTH_VALUES = new Set([11, 12]);
export default function SensorFaceGate() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanTimerRef = useRef(null);
  const iotTimerRef = useRef(null);
  /** Chỉ bắt đầu (lại) quét sau thời điểm này — khớp PDF: chờ 10s / 3s trước khi về dòng đầu. */
  const cooldownUntilRef = useRef(0);
  const noFaceStreakRef = useRef(0);
  const latestAuthRef = useRef(10);
  const prevAuthRef = useRef(10);
  const isScanningRef = useRef(false);
  const inFlightRef = useRef(false);
  const lastFrameUrlRef = useRef(null);

  const isCameraActive = useCallback(() => {
    if (isScanningRef.current) return true;
    const tracks = streamRef.current?.getTracks?.() ?? [];
    return tracks.some((t) => t.readyState === "live");
  }, []);

  const [live, setLive] = useState(false);
  const [lastDetect, setLastDetect] = useState(null);
  const [lastFrameUrl, setLastFrameUrl] = useState(null);
  const [banner, setBanner] = useState("");

  const setSnapshotFromVideo = useCallback(async (video, faces) => {
    if (!video?.videoWidth) return;
    const url = await captureDisplaySnapshot(video, faces);
    if (!url) return;
    if (lastFrameUrlRef.current) {
      URL.revokeObjectURL(lastFrameUrlRef.current);
    }
    lastFrameUrlRef.current = url;
    setLastFrameUrl(url);
  }, []);

  const endScan = useCallback(async (facesForSnapshot) => {
    const video = videoRef.current;
    const faces = facesForSnapshot ?? lastDetect?.faces;

    if (video?.videoWidth && faces?.length) {
      await setSnapshotFromVideo(video, faces);
    } else if (video?.videoWidth) {
      await setSnapshotFromVideo(video, []);
    }

    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    isScanningRef.current = false;
    noFaceStreakRef.current = 0;
    setLive(false);
    setLastDetect(null);
  }, [lastDetect, setSnapshotFromVideo]);

  const drawOverlay = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const rw = video.clientWidth || 640;
    const rh = video.clientHeight || 480;
    canvas.width = rw;
    canvas.height = rh;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, rw, rh);

    const faces = lastDetect?.faces;
    if (!faces?.length || !video.videoWidth) return;

    const nw = video.videoWidth;
    const nh = video.videoHeight;

    faces.forEach((face, index) => {
      const rect = mapBboxToDisplay(face.bbox, nw, nh, rw, rh);
      if (!rect) return;
      drawFaceBox(ctx, rect, face, index);
    });
  }, [lastDetect]);

  useLayoutEffect(() => {
    drawOverlay();
  }, [drawOverlay, live, lastDetect]);

  useEffect(() => {
    if (!live) return;
    const v = videoRef.current;
    if (!v || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => drawOverlay());
    ro.observe(v);
    return () => ro.disconnect();
  }, [live, drawOverlay]);

  const processAfterDetect = useCallback(async (res) => {
    const count = Number(res?.count ?? 0);
    if (count > 1) {
      setBanner("Verification failed: multiple people detected.");
      cooldownUntilRef.current = Date.now() + 3000;
      endScan(res?.faces);
      window.setTimeout(() => setBanner(""), 5000);
      return;
    }
    if (count !== 1) return;

    let cc = 0;
    let person = null;
    try {
      const st = await getFaceStatus();
      cc = Number(st?.data?.current_count ?? 0);
      person = st?.data?.current_person ?? null;
    } catch {
      /* ignore */
    }

    const detectedName = res.faces?.[0]?.recognized_name;
    const label =
      person && person !== "unknown"
        ? person
        : detectedName && detectedName !== "unknown"
        ? detectedName
        : "face";

    if (cc === 0) {
      setBanner(
        detectedName && detectedName !== "unknown"
          ? `Detected ${detectedName}. Verifying…`
          : "Starting face verification…"
      );
    } else {
      setBanner(`Verifying ${label} (${cc}/3)…`);
    }
  }, [endScan]);

  const tick = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !isScanningRef.current || inFlightRef.current) return;
    if (!video.videoWidth) return;

    inFlightRef.current = true;
    try {
      const file = await videoToJpegFile(video);
      if (!file) return;

      const res = await detectFaces(file);
      setLastDetect(res);
      requestAnimationFrame(() => drawOverlay());
      await setSnapshotFromVideo(video, res?.faces);

      const faceCount = Number(res?.count ?? 0);
      if (faceCount === 0) {
        noFaceStreakRef.current += 1;
      } else {
        /* Đặc tả: phát hiện mặt → reset đếm về 0 */
        noFaceStreakRef.current = 0;
      }

      let authNow = latestAuthRef.current;
      try {
        const iot = await getIotData();
        authNow = Number(iot.auth);
        latestAuthRef.current = authNow;
      } catch {
        /* dùng auth cache */
      }

      /* Bổ sung PDF: 10s không mặt (20 lần) + auth = 10 → tắt cam */
      if (noFaceStreakRef.current >= NO_FACE_STREAK_LIMIT && authNow === 10) {
        setBanner(
          `Không phát hiện khuôn mặt trong ${NO_FACE_WINDOW_MS / 1000}s — tắt camera (auth=${authNow}).`
        );
        endScan(res?.faces);
        window.setTimeout(() => setBanner(""), 5000);
        return;
      }

      await processAfterDetect(res);
    } catch (e) {
      console.error("[SensorFaceGate] tick", e);
    } finally {
      inFlightRef.current = false;
    }
  }, [processAfterDetect, endScan, drawOverlay, setSnapshotFromVideo]);

  const beginScan = useCallback(async () => {
    if (isCameraActive()) return;

    let auth = latestAuthRef.current;
    try {
      const data = await getIotData();
      auth = Number(data?.auth);
      if (Number.isFinite(auth)) {
        latestAuthRef.current = auth;
      }
    } catch {
      /* ignore */
    }

    if (auth !== 11) {
      return;
    }

    isScanningRef.current = true;
    noFaceStreakRef.current = 0;
    setBanner("");
    setLastDetect(null);
    if (lastFrameUrlRef.current) {
      URL.revokeObjectURL(lastFrameUrlRef.current);
      lastFrameUrlRef.current = null;
    }
    setLastFrameUrl(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      setLive(true);
      window.setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 50);

      scanTimerRef.current = window.setInterval(() => {
        tick();
      }, CAPTURE_MS);
    } catch (e) {
      console.error(e);
      isScanningRef.current = false;
      setLive(false);
      cooldownUntilRef.current = Date.now() + 5000;
      setBanner("Unable to open camera (permission or device).");
    }
  }, [tick, isCameraActive]);

  useEffect(() => {
    endScan();
    return () => {
      if (lastFrameUrlRef.current) {
        URL.revokeObjectURL(lastFrameUrlRef.current);
        lastFrameUrlRef.current = null;
      }
    };
  }, [endScan]);

  useEffect(() => {
    iotTimerRef.current = window.setInterval(async () => {
      try {
        const data = await getIotData();
        const auth = Number(data?.auth);
        if (!Number.isFinite(auth)) return;

        const prevAuth = prevAuthRef.current;
        latestAuthRef.current = auth;
        prevAuthRef.current = auth;
        const now = Date.now();

        /* auth 11/12: giữ cam; 13/14/10: dừng (face_service đã gửi auth qua MQTT). */
        if (!SCAN_AUTH_VALUES.has(auth)) {
          if (isCameraActive()) {
            if (auth === 13) {
              setBanner("Authentication successful. Door unlocked.");
              cooldownUntilRef.current = Date.now() + 10000;
              window.setTimeout(() => setBanner(""), 10000);
            } else if (auth === 14) {
              setBanner("Authentication failed.");
              cooldownUntilRef.current = Date.now() + 3000;
              window.setTimeout(() => setBanner(""), 3000);
            }
            endScan();
          }
          return;
        }

        const authRising = prevAuth !== 11 && auth === 11;
        const mayReopenAfterCooldown =
          !isCameraActive() && now >= cooldownUntilRef.current;

        if ((authRising || mayReopenAfterCooldown) && auth === 11) {
          beginScan();
        }
      } catch (e) {
        console.error("[SensorFaceGate] IoT poll", e);
      }
    }, IOT_POLL_MS);

    return () => {
      if (iotTimerRef.current) {
        clearInterval(iotTimerRef.current);
        iotTimerRef.current = null;
      }
      endScan();
    };
  }, [beginScan, endScan, isCameraActive]);

  return (
    <div className="sensor-gate-card face-auto-gate-card">
      <p className="iot-card-label">SMART HOME</p>
      <h2 className="face-page-title">Face Recognition</h2>
      <div className="sensor-gate-head">
        <div>
          <p className="sensor-gate-label">AUTO GATE</p>
          <h3>Sensor-triggered recognition</h3>
        </div>
      </div>

      {banner && <div className="sensor-banner">{banner}</div>}

      <div className="sensor-video-wrap">
        {live ? (
          <>
            <video ref={videoRef} className="sensor-video" autoPlay playsInline muted />
            <canvas ref={canvasRef} className="sensor-overlay-canvas" />
          </>
        ) : lastFrameUrl ? (
          <img
            src={lastFrameUrl}
            alt="Last recognition frame"
            className="sensor-video sensor-last-frame"
          />
        ) : (
          <div className="sensor-placeholder">
            <p>Camera off.</p>
          </div>
        )}
      </div>
    </div>
  );
}
