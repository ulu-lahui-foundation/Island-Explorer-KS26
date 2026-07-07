import { useRef, useState, useCallback, useEffect } from "react";
import { useGame, PLANT_DATABASE, Plant } from "@/lib/GameContext";
import { PLANT_ALIASES } from "@/lib/plantData";
import { Camera as CameraIcon, Check, RefreshCw, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ---------------------------------------------------------------------------
// Robust AI label → our Plant mapping
// ---------------------------------------------------------------------------

function findPlantByLabel(label: string): Plant | null {
  if (!label) return null;

  const lower = label.toLowerCase().trim();
  const stripped = lower.replace(/[^a-z]/g, "");

  return (
    PLANT_DATABASE.find((p) => {
      const aliases = PLANT_ALIASES[p.id] ?? [];
      return aliases.some((alias) => {
        const a = alias.toLowerCase();
        const as = a.replace(/[^a-z]/g, "");
        return (
          lower === a ||
          lower.includes(a) ||
          a.includes(lower) ||
          stripped.includes(as) ||
          as.includes(stripped)
        );
      });
    }) ?? null
  );
}

// ---------------------------------------------------------------------------

type ScanState = "idle" | "scanning" | "flashing" | "classifying" | "done" | "unknown" | "error";

export function CameraPage() {
  const { collectPlant, incrementScanCount } = useGame();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [scanState, setScanState] = useState<ScanState>("idle");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [foundPlant, setFoundPlant] = useState<(typeof PLANT_DATABASE)[0] | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [debugLabel, setDebugLabel] = useState<string | null>(null);

  // Auto-start camera on mount
  useEffect(() => {
    startCamera(facingMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = useCallback(async (facing: "environment" | "user") => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setCameraReady(true);
      }
    } catch (err) {
      const e = err as DOMException;
      if (e.name === "NotAllowedError") {
        setCameraError("Camera permission denied. Please allow camera access and try again.");
      } else {
        setCameraError("Could not access camera.");
      }
    }
  }, []);

  const flipCamera = () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    startCamera(next);
  };

  const takeSnapshot = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !cameraReady) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    setScanState("flashing");
    setTimeout(() => setScanState("classifying"), 200);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        classifyImage(blob);
      },
      "image/jpeg",
      0.85,
    );
  };

  const classifyImage = async (imageBlob: Blob) => {
    try {
      const fd = new FormData();
      fd.append("image", imageBlob, "capture.jpg");

      const res = await fetch("/api/classify-plant", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        throw new Error(`Server error ${res.status}`);
      }

      const data = await res.json();
      const top = data?.predictions?.[0];
      const label = top?.class ?? top?.label ?? "Unknown";
      const confidence = top?.confidence ?? 0;
      setDebugLabel(`${label} (${(confidence * 100).toFixed(0)}%)`);

      incrementScanCount();

      if (confidence < 0.3) {
        setFoundPlant(null);
        setScanState("unknown");
        return;
      }

      const plant = findPlantByLabel(label);
      setFoundPlant(plant);
      setScanState(plant ? "done" : "unknown");
    } catch {
      setScanState("error");
    }
  };

  const closeResult = () => {
    setScanState("idle");
    setFoundPlant(null);
    setDebugLabel(null);
  };

  const collect = () => {
    if (foundPlant) {
      collectPlant(foundPlant);
    }
    closeResult();
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#0a1a10]">
      {/* Video feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Initialising camera overlay */}
      {!cameraReady && !cameraError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          >
            <Zap size={32} color="#5CC882" />
          </motion.div>
        </div>
      )}

      {/* Error overlay */}
      {cameraError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30">
          <div className="text-center px-6">
            <p className="text-white font-bold text-lg mb-4">{cameraError}</p>
            <button
              onClick={() => startCamera(facingMode)}
              className="px-6 py-3 rounded-xl bg-[#5CC882] text-[#1A3828] font-bold"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 pt-12 pb-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="w-9 h-9" />
        <span className="font-bold text-sm text-white/80">Scan a Plant</span>
        <button
          onClick={flipCamera}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(20,40,28,0.55)', backdropFilter: 'blur(8px)' }}
        >
          <RefreshCw size={16} color="#fff" />
        </button>
      </div>

      {/* ── Tall corner brackets + scanning line ── */}
      {cameraReady && scanState === "idle" && (
        <>
          {/* Corner brackets — 40 % smaller frame, clear of UI */}
          <div className="absolute top-32 bottom-44 left-20 right-20 flex flex-col justify-center z-10">
            <div className="flex justify-between">
              <div className="w-4 h-4 border-l-[3px] border-t-[3px] rounded-tl-sm border-[#5CC882]" />
              <div className="w-4 h-4 border-r-[3px] border-t-[3px] rounded-tr-sm border-[#5CC882]" />
            </div>
            <div className="flex-1" />
            <div className="flex justify-between">
              <div className="w-4 h-4 border-l-[3px] border-b-[3px] rounded-bl-sm border-[#5CC882]" />
              <div className="w-4 h-4 border-r-[3px] border-b-[3px] rounded-br-sm border-[#5CC882]" />
            </div>
          </div>

          {/* Sweeping scan line — animate inside the shrunken frame */}
          <motion.div
            className="absolute left-20 right-20 h-0.5 bg-[#5CC882]/60 rounded-full z-10"
            initial={{ top: '28%' }}
            animate={{ top: ['28%', '72%', '28%'] }}
            transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity }}
          />
        </>
      )}

      {/* Center capture button */}
      {cameraReady && scanState === "idle" && (
        <button
          onClick={takeSnapshot}
          className="absolute bottom-[40px] left-1/2 -translate-x-1/2 z-20 w-14 h-14 rounded-full bg-white shadow-lg active:scale-95 transition-transform"
        />
      )}

      {/* Flash overlay */}
      <AnimatePresence>
        {scanState === "flashing" && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-white z-50 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Classifying overlay */}
      <AnimatePresence>
        {scanState === "classifying" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 z-40 flex flex-col items-center justify-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="mb-4"
            >
              <Zap size={40} color="#5CC882" />
            </motion.div>
            <p className="text-white font-bold text-lg">Identifying plant...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result overlay — found */}
      <AnimatePresence>
        {scanState === "done" && foundPlant && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="absolute inset-x-0 bottom-0 z-50 rounded-t-[2rem] overflow-hidden"
            style={{ background: '#F6F1E7', maxHeight: '60%' }}
          >
            <div className="p-6 pb-12 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-[#5CC882] flex items-center justify-center mb-3">
                <Check size={36} color="#1A3828" />
              </div>
              <p className="text-[#2F6F4E] font-bold text-sm uppercase tracking-wider mb-1">
                Plant Found
              </p>
              <h2 className="text-[#26342F] font-extrabold text-3xl mb-1">
                {foundPlant.name}
              </h2>
              <p className="text-[#26342F]/60 text-sm font-semibold italic mb-4">
                {foundPlant.scientific}
              </p>
              <p className="text-[#26342F]/70 text-sm leading-relaxed max-w-xs mb-6">
                {foundPlant.description}
              </p>
              {debugLabel && (
                <p className="text-[#26342F]/40 text-xs font-medium mb-4">{debugLabel}</p>
              )}
              <button
                onClick={collect}
                className="w-full py-3.5 rounded-2xl bg-[#2F6F4E] text-white font-extrabold text-base shadow-lg active:scale-[0.98] transition-transform"
              >
                Collect Plant
              </button>
              <button
                onClick={closeResult}
                className="mt-3 text-[#26342F]/50 font-semibold text-sm"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result overlay — not found */}
      <AnimatePresence>
        {scanState === "unknown" && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="absolute inset-x-0 bottom-0 z-50 rounded-t-[2rem] overflow-hidden"
            style={{ background: '#F6F1E7', maxHeight: '60%' }}
          >
            <div className="p-6 pb-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#E8E4DB] flex items-center justify-center mb-3">
                <CameraIcon size={28} color="#999" />
              </div>
              <p className="text-[#999] font-bold text-sm uppercase tracking-wider mb-1">
                No Match
              </p>
              <h2 className="text-[#26342F] font-extrabold text-2xl mb-2">
                Couldn\u2019t identify this plant
              </h2>
              <p className="text-[#26342F]/60 text-sm leading-relaxed max-w-xs mb-5">
                Try again with better lighting or a closer angle.
              </p>
              {debugLabel && (
                <p className="text-[#26342F]/40 text-xs font-medium mb-4">{debugLabel}</p>
              )}
              <button
                onClick={closeResult}
                className="w-full py-3.5 rounded-2xl bg-[#2F6F4E] text-white font-extrabold text-base shadow-lg active:scale-[0.98] transition-transform"
              >
                Scan Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error overlay */}
      <AnimatePresence>
        {scanState === "error" && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="absolute inset-x-0 bottom-0 z-50 rounded-t-[2rem] overflow-hidden"
            style={{ background: '#F6F1E7', maxHeight: '60%' }}
          >
            <div className="p-6 pb-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#E8E4DB] flex items-center justify-center mb-3">
                <Zap size={28} color="#999" />
              </div>
              <p className="text-[#999] font-bold text-sm uppercase tracking-wider mb-1">
                Error
              </p>
              <h2 className="text-[#26342F] font-extrabold text-2xl mb-2">
                Something went wrong
              </h2>
              <p className="text-[#26342F]/60 text-sm leading-relaxed max-w-xs mb-5">
                Couldn\u2019t reach the plant identification server. Check your connection and try again.
              </p>
              <button
                onClick={closeResult}
                className="w-full py-3.5 rounded-2xl bg-[#2F6F4E] text-white font-extrabold text-base shadow-lg active:scale-[0.98] transition-transform"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
