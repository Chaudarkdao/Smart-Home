import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { getIotData } from "../../services/iotApi";
import { detectFaces, getFaceStatus } from "../../services/faceApi";

const CAPTURE_MS = 500;
const IOT_POLL_MS = 400;
/** 10s × (1000/500) = 20 lần chụp liên tiếp không có mặt (đặc tả bổ sung). */
const NO_FACE_STREAK_LIMIT = 20;

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

/**
 * Luồng đặc tả: khi IoT auth === 11 (cảm biến / Yolobit báo chuyển động), tự mở camera,
 * chụp mỗi 0.5s, gọi /api/face/detect, vẽ bbox; >1 người thì thất bại và đóng cam;
 * đúng 1 người: đọc /api/face/status trước frame; nếu current_count === 0 thì xét tên từ detect.
 * Sau thành công chờ 10s / thất bại unknown chờ 3s rồi quay lại đầu vòng (mở lại cam nếu auth vẫn 11).
 * Bổ sung: 20 lần liên tiếp không mặt (10s) + auth = 10 → tắt cam; có mặt thì reset đếm.
 * current_count !== 0 → tiếp tục chụp (không kết luận mở cửa).
 */
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
  const isScanningRef = useRef(false);
  const inFlightRef = useRef(false);

  const [live, setLive] = useState(false);
  const [lastDetect, setLastDetect] = useState(null);
  const [banner, setBanner] = useState("");

  const endScan = useCallback(() => {
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
  }, []);

  const drawOverlay = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !lastDetect?.faces?.length) {
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx && video) {
          const rw = video.clientWidth || 640;
          const rh = video.clientHeight || 480;
          canvas.width = rw;
          canvas.height = rh;
          ctx.clearRect(0, 0, rw, rh);
        }
      }
      return;
    }

    const rw = video.clientWidth || 640;
    const rh = video.clientHeight || 480;
    canvas.width = rw;
    canvas.height = rh;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const nw = video.videoWidth || rw;
    const nh = video.videoHeight || rh;
    const sx = rw / nw;
    const sy = rh / nh;

    ctx.clearRect(0, 0, rw, rh);
    lastDetect.faces.forEach((face, index) => {
      if (!face.bbox || face.bbox.length < 4) return;
      const [x1, y1, x2, y2] = face.bbox;
      const bx = x1 * sx;
      const by = y1 * sy;
      const bw = (x2 - x1) * sx;
      const bh = (y2 - y1) * sy;
      const recognized =
        face.recognized_name && face.recognized_name !== "unknown"
          ? face.recognized_name
          : null;
      const label = recognized || `Face ${index + 1}`;
      const conf = Number(face.confidence || 0).toFixed(2);
      const text = `${label} (${conf})`;
      const strokeColor = recognized ? "#22c55e" : "#38bdf8";

      ctx.lineWidth = 2;
      ctx.strokeStyle = strokeColor;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.font = "bold 13px system-ui,sans-serif";
      const tw = ctx.measureText(text).width;
      const ly = by > 22 ? by - 22 : by + 4;
      ctx.fillStyle = strokeColor;
      ctx.fillRect(bx, ly, tw + 12, 20);
      ctx.fillStyle = "#0f172a";
      ctx.fillText(text, bx + 6, ly + 15);
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

  const processAfterDetect = useCallback(
    async (res, ccBefore) => {
      const count = Number(res?.count ?? 0);
      if (count > 1) {
        setBanner("Verification failed: multiple people detected. Closing camera.");
        cooldownUntilRef.current = Date.now() + 3000;
        endScan();
        window.setTimeout(() => setBanner(""), 5000);
        return;
      }
      if (count !== 1) return;

      // PDF: current_count khác 0 → vẫn tiếp tục chụp, không xác nhận mở cửa.
      if (ccBefore !== 0) return;

      const name = res.faces?.[0]?.recognized_name;
      if (name && name !== "unknown") {
        setBanner(`Verified: ${name}. Door unlocked — resuming in 10s.`);
        cooldownUntilRef.current = Date.now() + 10000;
        endScan();
        window.setTimeout(() => setBanner(""), 10000);
        return;
      }

      setBanner("Auth failed: unknown face. Retrying in 3s…");
      cooldownUntilRef.current = Date.now() + 3000;
      endScan();
      window.setTimeout(() => setBanner(""), 3000);
    },
    [endScan]
  );

  const tick = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !isScanningRef.current || inFlightRef.current) return;
    if (!video.videoWidth) return;

    inFlightRef.current = true;
    try {
      let ccBefore = 0;
      try {
        const st = await getFaceStatus();
        ccBefore = Number(st?.data?.current_count ?? 0);
      } catch {
        ccBefore = 0;
      }

      const file = await videoToJpegFile(video);
      if (!file) return;

      const res = await detectFaces(file);
      setLastDetect(res);

      const faceCount = Number(res?.count ?? 0);
      if (faceCount === 0) {
        noFaceStreakRef.current += 1;
      } else {
        noFaceStreakRef.current = 0;
      }

      if (
        noFaceStreakRef.current >= NO_FACE_STREAK_LIMIT &&
        latestAuthRef.current === 10
      ) {
        setBanner(
          "No face detected for 10s — closing camera."
        );
        endScan();
        window.setTimeout(() => setBanner(""), 5000);
        return;
      }

      await processAfterDetect(res, ccBefore);
    } catch (e) {
      console.error("[SensorFaceGate] tick", e);
    } finally {
      inFlightRef.current = false;
    }
  }, [processAfterDetect, endScan]);

  const beginScan = useCallback(async () => {
    if (isScanningRef.current) return;
    isScanningRef.current = true;
    noFaceStreakRef.current = 0;
    setBanner("");
    setLastDetect(null);
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
  }, [tick]);

  useEffect(() => {
    iotTimerRef.current = window.setInterval(async () => {
      try {
        const data = await getIotData();
        const auth = Number(data.auth);
        latestAuthRef.current = auth;
        const now = Date.now();

        // PDF: "khi nhận được auth là 11" — mức 11, không chỉ cạnh 10→11.
        // Sau kết thúc vòng (đóng cam), chỉ mở lại khi hết cooldown (10s / 3s theo đặc tả).
        if (auth === 11 && !isScanningRef.current && now >= cooldownUntilRef.current) {
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
  }, [beginScan, endScan]);

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
        ) : (
          <div className="sensor-placeholder">
            <p>Camera off.</p>
          </div>
        )}
      </div>
    </div>
  );
}
