import { useState, useEffect, useRef, useCallback } from "react";
import { useGame, PLANT_DATABASE } from "@/lib/GameContext";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, RotateCcw, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";

const CLASSIFY_URL = "/api/classify-plant";

// ---------------------------------------------------------------------------
// Response parsing — fully defensive against any Roboflow workflow output shape.
// The new workflow (plant-identification-app-20-v6-logic) may use different
// output key names than the old classifier. We walk the entire outputs array
// and collect every string that looks like a class / prediction label.
// ---------------------------------------------------------------------------

/** Recursively collect every string value of keys that sound like a prediction label */
function collectLabels(obj: unknown, depth = 0): string[] {
  if (depth > 6 || !obj || typeof obj !== "object") return [];
  const LABEL_KEYS = new Set([
    "top", "class", "label", "plant", "predicted_class",
    "prediction", "name", "result", "classification",
  ]);

  const results: string[] = [];

  if (Array.isArray(obj)) {
    for (const item of obj) results.push(...collectLabels(item, depth + 1));
    return results;
  }

  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    if (LABEL_KEYS.has(key.toLowerCase()) && typeof val === "string" && val.length > 0) {
      results.push(val);
    } else {
      results.push(...collectLabels(val, depth + 1));
    }
  }
  return results;
}

/** Pick the most useful label from a Roboflow workflow response */
function extractTopPrediction(result: unknown): string | null {
  try {
    const data = result as Record<string, unknown>;

    // Standard workflow shape: { outputs: [ { <output_name>: { top, predictions, ... } } ] }
    if (Array.isArray(data?.outputs)) {
      for (const out of data.outputs as unknown[]) {
        const labels = collectLabels(out);
        if (labels.length > 0) {
          console.log("[Scan] all labels found in outputs:", labels);
          return labels[0];
        }
      }
    }

    // Flat shape fallback: { top, class, predictions: [...] }
    const labels = collectLabels(data);
    if (labels.length > 0) return labels[0];

    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Plant matching — alias table handles every known class name variant.
// Add new aliases here when the model is retrained with different labels.
// ---------------------------------------------------------------------------

const PLANT_ALIASES: Record<string, string[]> = {
  ohia:  ["ohia", "ohia lehua", "lehua", "metrosideros", "ohia-lehua"],
  kalo:  ["kalo", "taro", "colocasia", "dasheen", "poi", "coco yam", "cocoyam", "hawaiian taro"],
  kukui: ["kukui", "candlenut", "aleurites", "candletree", "kukui nut"],
};

function matchPlant(label: string | null) {
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
  const { collectPlant } = useGame();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [scanState, setScanState] = useState<ScanState>("idle");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [foundPlant, setFoundPlant] = useState<(typeof PLANT_DATABASE)[0] | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [debugLabel, setDebugLabel] = useState<string | null>(null);

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
        setCameraError("Unable to start camera. Please check your device.");
      }
    }
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [facingMode, startCamera]);

  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  const captureBase64 = (): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    const MAX_WIDTH = 640;
    const scale = Math.min(1, MAX_WIDTH / (video.videoWidth || 640));
    canvas.width = Math.round((video.videoWidth || 640) * scale);
    canvas.height = Math.round((video.videoHeight || 480) * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
    return dataUrl.split(",")[1];
  };

  const handleScan = async () => {
    if (scanState !== "idle" || !cameraReady) return;

    setScanState("scanning");
    setDebugLabel(null);

    await new Promise((r) => setTimeout(r, 1800));

    setScanState("flashing");
    await new Promise((r) => setTimeout(r, 350));

    const base64 = captureBase64();
    setScanState("classifying");

    if (!base64) {
      setScanState("error");
      return;
    }

    try {
      const response = await fetch(CLASSIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();

      const label = extractTopPrediction(result);
      console.log("[Scan] raw label from Roboflow:", label);
      setDebugLabel(label);

      const plant = matchPlant(label);
      console.log("[Scan] matched plant:", plant?.id ?? "none");

      if (plant) {
        setFoundPlant(plant);
        setScanState("done");
      } else {
        setScanState("unknown");
      }
    } catch (err) {
      console.error("Roboflow error:", err);
      setScanState("error");
    }
  };

  const handleCollect = () => {
    if (foundPlant) collectPlant(foundPlant);
    resetScan();
  };

  const resetScan = () => {
    setFoundPlant(null);
    setScanState("idle");
    setDebugLabel(null);
  };

  const isScanning = scanState === "scanning";
  const isClassifying = scanState === "classifying";
  const isFlashing = scanState === "flashing";
  const isActive = scanState === "idle" || isScanning || isFlashing || isClassifying;

  return (
    <div className="relative w-full h-full bg-black flex flex-col overflow-hidden pb-20">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{ display: cameraReady ? "block" : "none" }}
      />
      <canvas ref={canvasRef} className="hidden" />

      {!cameraReady && !cameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
            <Camera size={40} className="text-green-400" />
          </motion.div>
          <p className="text-white/70 text-sm">Starting camera…</p>
        </div>
      )}

      {cameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
          <Camera size={48} className="text-red-400" />
          <p className="text-white text-center text-sm leading-relaxed">{cameraError}</p>
          <Button variant="outline" className="border-white/30 text-white" onClick={() => startCamera(facingMode)}>
            Try Again
          </Button>
        </div>
      )}

      {/* Viewfinder — tall corners spanning most of the screen */}
      {isActive && cameraReady && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Corner brackets: top pair near top, bottom pair ~144px above nav */}
          <motion.div
            animate={isScanning || isClassifying ? { opacity: [1, 0.4, 1] } : { opacity: 1 }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="absolute inset-0"
          >
            {/* Top-left */}
            <div className="absolute top-10 left-5 w-10 h-10 border-t-4 border-l-4 border-green-400 rounded-tl-sm" />
            {/* Top-right */}
            <div className="absolute top-10 right-5 w-10 h-10 border-t-4 border-r-4 border-green-400 rounded-tr-sm" />
            {/* Bottom-left — kept in place */}
            <div className="absolute bottom-36 left-5 w-10 h-10 border-b-4 border-l-4 border-green-400 rounded-bl-sm" />
            {/* Bottom-right — kept in place */}
            <div className="absolute bottom-36 right-5 w-10 h-10 border-b-4 border-r-4 border-green-400 rounded-br-sm" />
          </motion.div>

          {/* Scanning line — travels the full height between the corner pairs */}
          <AnimatePresence>
            {isScanning && (
              <motion.div
                key="scan-line"
                className="absolute left-5 right-5 h-0.5 bg-green-400 shadow-[0_0_12px_4px_rgba(74,222,128,0.6)]"
                style={{ top: 56 }}           /* start just below top corners (top-10 = 40px + bracket height) */
                animate={{ top: "calc(100% - 176px)" }}   /* end at bottom-36 (144px) + bracket (32px) */
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            )}
          </AnimatePresence>

          {/* Status label — same position as before, just above shutter */}
          <div className="absolute bottom-24 left-0 right-0 flex justify-center">
            <div className="px-4 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
              <p className="text-white/80 text-xs tracking-widest uppercase">
                {isScanning ? "Scanning…" : isClassifying ? "Identifying…" : "Point at a plant"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Flash */}
      <AnimatePresence>
        {isFlashing && (
          <motion.div
            key="flash"
            className="absolute inset-0 bg-white z-40 pointer-events-none"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </AnimatePresence>

      {/* Flip camera */}
      {cameraReady && isActive && (
        <button
          onClick={handleFlipCamera}
          className="absolute top-5 right-5 w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white"
          data-testid="button-flip-camera"
        >
          <RotateCcw size={18} />
        </button>
      )}

      {/* Shutter — midway between status label (bottom-24) and nav bar (bottom-0) */}
      {cameraReady && (
        <div className="absolute bottom-10 left-0 right-0 flex justify-center">
          <button
            data-testid="button-shutter"
            onClick={handleScan}
            disabled={!isActive || scanState !== "idle"}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-all duration-150 disabled:opacity-40"
          >
            <motion.div
              className="w-16 h-16 rounded-full bg-white"
              animate={isScanning || isClassifying ? { scale: [1, 0.92, 1] } : { scale: 1 }}
              transition={{ repeat: Infinity, duration: 0.9 }}
            />
          </button>
        </div>
      )}

      {/* ── Result Sheets ── */}

      {/* SUCCESS */}
      <AnimatePresence>
        {scanState === "done" && foundPlant && (
          <motion.div
            key="success-sheet"
            className="absolute inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full bg-white rounded-t-3xl p-6 pb-28 shadow-2xl"
              initial={{ y: "100%" }} animate={{ y: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="flex justify-end mb-1">
                <button onClick={resetScan} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              <div className="text-center mb-5">
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                  Plant Identified
                </span>
                <h2 className="text-3xl font-bold text-gray-900">You found {foundPlant.name}! 🌿</h2>
              </div>
              <div className="aspect-square w-44 mx-auto rounded-2xl overflow-hidden shadow-lg mb-5 border-4 border-white ring-2 ring-green-200">
                <img src={foundPlant.image} alt={foundPlant.name} className="w-full h-full object-cover" />
              </div>
              <p className="text-center text-gray-600 mb-7 px-4 font-medium leading-relaxed text-sm">
                {foundPlant.info}
              </p>
              {debugLabel && (
                <p className="text-center text-xs text-gray-400 mb-3">Model returned: <em>{debugLabel}</em></p>
              )}
              <Button
                data-testid="button-add-to-inventory"
                onClick={handleCollect}
                className="w-full py-6 text-lg rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30"
              >
                Add to Inventory
              </Button>
              <Button variant="ghost" onClick={resetScan} className="w-full mt-2">Discard</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UNKNOWN PLANT */}
      <AnimatePresence>
        {scanState === "unknown" && (
          <motion.div
            key="unknown-sheet"
            className="absolute inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full bg-white rounded-t-3xl p-6 pb-28 shadow-2xl"
              initial={{ y: "100%" }} animate={{ y: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                  <Leaf size={36} className="text-amber-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Plant Not Recognized</h2>
                <p className="text-gray-500 text-sm leading-relaxed px-4">
                  We couldn't identify that plant. Try getting closer, better lighting, or make sure
                  a plant is clearly in the frame.
                </p>
                {debugLabel && (
                  <p className="text-xs text-gray-400 mt-3">Model returned: <em>"{debugLabel}"</em></p>
                )}
              </div>
              <Button data-testid="button-try-again" onClick={resetScan} className="w-full py-5 text-base rounded-2xl">
                Try Again
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ERROR */}
      <AnimatePresence>
        {scanState === "error" && (
          <motion.div
            key="error-sheet"
            className="absolute inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full bg-white rounded-t-3xl p-6 pb-28 shadow-2xl"
              initial={{ y: "100%" }} animate={{ y: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                  <X size={36} className="text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
                <p className="text-gray-500 text-sm leading-relaxed px-4">
                  Couldn't reach the plant identification service. Check your internet connection and try again.
                </p>
              </div>
              <Button data-testid="button-retry-error" onClick={resetScan} className="w-full py-5 text-base rounded-2xl">
                Try Again
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
