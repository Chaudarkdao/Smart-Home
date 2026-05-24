import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { getIotData } from "../../services/iotApi";
import { detectFaces, getFaceStatus } from "../../services/faceApi";

/** Đặc tả: auth=11 → cam chụp liên tục 0.5s/lần, mỗi lần gọi /api/face/detect */
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
const VERIFY_BANNER = "Verifying face…";

export default function SensorFaceGate() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanTimerRef = useRef(null);
  /** Thời điểm bắt đầu lần chụp tiếp theo (giữ nhịp 0.5s theo đặc tả). */
  const scanNextAtRef = useRef(0);
  const iotTimerRef = useRef(null);
  /** Chỉ bắt đầu (lại) quét sau thời điểm này — khớp PDF: chờ 10s / 3s trước khi về dòng đầu. */
  const cooldownUntilRef = useRef(0);
  const noFaceStreakRef = useRef(0);
  const latestAuthRef = useRef(10);
  const prevAuthRef = useRef(10);
  const isScanningRef = useRef(false);
  const verifyingBannerRef = useRef(false);
  const lastDetectRef = useRef(null);
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
    const faces = facesForSnapshot ?? lastDetectRef.current?.faces;

    if (video?.videoWidth && faces?.length) {
      await setSnapshotFromVideo(video, faces);
    } else if (video?.videoWidth) {
      await setSnapshotFromVideo(video, []);
    }

    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    scanNextAtRef.current = 0;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    isScanningRef.current = false;
    verifyingBannerRef.current = false;
    noFaceStreakRef.current = 0;
    setLive(false);
    setLastDetect(null);
    lastDetectRef.current = null;
  }, [setSnapshotFromVideo]);

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

    /* Đặc tả + chat: 0 người → biến đếm backend không đổi, cam vẫn chụp. */
    if (count === 0) return;

    if (count > 1) {
      setBanner("Verification failed: multiple people detected.");
      /* Backend gửi auth=14 — chỉ tắt cam khi nhận auth (đủ 3 lần / fail qua MQTT). */
      return;
    }

    /* count === 1: đặc tả — gọi /api/face/status; đếm 3 lần do backend. */
    if (!verifyingBannerRef.current) {
      verifyingBannerRef.current = true;
      setBanner(VERIFY_BANNER);
    }
    try {
      await getFaceStatus();
    } catch {
      /* backend offline — vẫn giữ cam, chờ auth 13/14 */
    }
  }, []);

  const tick = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !isScanningRef.current) return;
    if (!video.videoWidth) return;

    try {
      const file = await videoToJpegFile(video);
      if (!file) return;

      const res = await detectFaces(file);
      lastDetectRef.current = res;
      setLastDetect(res);
      requestAnimationFrame(() => drawOverlay());

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
    }
  }, [processAfterDetect, endScan, drawOverlay]);

  /** Lên lịch chụp + /detect đúng 0.5s giữa các lần bắt đầu (đặc tả). */
  const scheduleScanLoop = useCallback(() => {
    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }

    const loop = () => {
      if (!isScanningRef.current) return;
      const delay = Math.max(0, scanNextAtRef.current - Date.now());
      scanTimerRef.current = window.setTimeout(async () => {
        if (!isScanningRef.current) return;
        if (!scanNextAtRef.current) {
          scanNextAtRef.current = Date.now();
        }
        scanNextAtRef.current += CAPTURE_MS;
        await tick();
        loop();
      }, delay);
    };

    scanNextAtRef.current = Date.now();
    loop();
  }, [tick]);

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
    verifyingBannerRef.current = false;
    noFaceStreakRef.current = 0;
    setBanner("");
    setLastDetect(null);
    lastDetectRef.current = null;
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
        scheduleScanLoop();
      }, 50);
    } catch (e) {
      console.error(e);
      isScanningRef.current = false;
      setLive(false);
      cooldownUntilRef.current = Date.now() + 5000;
      setBanner("Unable to open camera (permission or device).");
    }
  }, [scheduleScanLoop, isCameraActive]);

  useEffect(() => {
    return () => {
      if (scanTimerRef.current) {
        clearTimeout(scanTimerRef.current);
      }
      if (iotTimerRef.current) {
        clearInterval(iotTimerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (lastFrameUrlRef.current) {
        URL.revokeObjectURL(lastFrameUrlRef.current);
        lastFrameUrlRef.current = null;
      }
    };
  }, []);

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

        /* Chỉ tắt cam khi đủ 3 lần (auth 13/14). auth=10: tick xử lý 20 lần không mặt. */
        if (auth === 13 || auth === 14) {
          if (isCameraActive()) {
            if (auth === 13) {
              setBanner("Authentication successful. Door unlocked.");
              cooldownUntilRef.current = Date.now() + 10000;
              window.setTimeout(() => setBanner(""), 10000);
            } else {
              setBanner("Authentication failed.");
              cooldownUntilRef.current = Date.now() + 3000;
              window.setTimeout(() => setBanner(""), 3000);
            }
            endScan();
          }
          return;
        }

        if (!SCAN_AUTH_VALUES.has(auth)) {
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
          {live && (
            <p className="sensor-scan-rate" title="Theo đặc tả: 0.5 giây mỗi lần chụp">
              Nhận diện liên tục — {CAPTURE_MS / 1000}s/lần
            </p>
          )}
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
