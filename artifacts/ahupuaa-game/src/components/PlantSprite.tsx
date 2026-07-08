import { useState, useEffect } from "react";
import { generatePlantSprite, getCachedPlantSprite } from "@/lib/plantSprites";
import { Leaf } from "lucide-react";

export function PlantSprite({ plantId, className = "" }: { plantId: string; className?: string }) {
  const [src, setSrc] = useState<string | undefined>(getCachedPlantSprite(plantId));
  const [error, setError] = useState(false);

  useEffect(() => {
    if (src || error) return;
    let cancelled = false;
    generatePlantSprite(plantId, 128)
      .then((url) => {
        if (!cancelled) setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => { cancelled = true; };
  }, [plantId, src, error]);

  if (!src) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ background: "rgba(47,111,78,0.15)" }}>
        {error ? (
          <Leaf className="w-4 h-4 opacity-40" />
        ) : (
          <div className="animate-pulse w-6 h-6 rounded-full" style={{ background: "rgba(47,111,78,0.25)" }} />
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={plantId}
      className={`w-full h-full object-contain ${className}`}
      style={{ imageRendering: "auto" }}
    />
  );
}
