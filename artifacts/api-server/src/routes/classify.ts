import { Router } from "express";
import express from "express";
import multer from "multer";

const router = Router();

const ROBOFLOW_URL =
  "https://serverless.roboflow.com/aina-intelligence-lab/workflows/plant-identification-app-20-v10-logic";

const RETRY_ATTEMPTS = 2;
const TIMEOUT_MS = 20_000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype.startsWith("image/"));
  },
});

/** Strip any base64 image blobs before logging so predictions stay readable */
function stripImageBlobs(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(stripImageBlobs);
  if (obj && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (
        typeof v === "string" &&
        v.length > 200 &&
        (k.toLowerCase().includes("image") ||
          k.toLowerCase().includes("base64") ||
          k.toLowerCase().includes("value"))
      ) {
        result[k] = `<${typeof v} len=${v.length} omitted>`;
      } else {
        result[k] = stripImageBlobs(v);
      }
    }
    return result;
  }
  return obj;
}

/** Call Roboflow with exponential backoff retries and an AbortController timeout */
async function callRoboflow(
  apiKey: string,
  imageBase64: string,
  attempt = 0
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const rfRes = await fetch(ROBOFLOW_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        inputs: {
          image: { type: "base64", value: imageBase64 },
        },
      }),
      signal: controller.signal,
    });

    const text = await rfRes.text();

    if (!rfRes.ok) {
      const err = new Error(`Roboflow HTTP ${rfRes.status}: ${text.slice(0, 500)}`);
      (err as NodeJS.ErrnoException).code = String(rfRes.status);
      throw err;
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Roboflow non-JSON response: ${text.slice(0, 200)}`);
    }
  } catch (err) {
    clearTimeout(timer);

    const isRetryable =
      attempt < RETRY_ATTEMPTS &&
      err instanceof Error &&
      (err.name === "AbortError" ||
        (err as NodeJS.ErrnoException).code === "ECONNRESET" ||
        (err as NodeJS.ErrnoException).code === "503" ||
        (err as NodeJS.ErrnoException).code === "429");

    if (isRetryable) {
      const delay = 500 * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
      return callRoboflow(apiKey, imageBase64, attempt + 1);
    }

    throw err;
  } finally {
    clearTimeout(timer);
  }
}

type Prediction = { class?: string; label?: string; confidence?: number };

/** Extract predictions from result.outputs[0].predictions (handles both array and nested object shapes) */
function extractPredictions(data: unknown): Prediction[] {
  const outputs = (data as { outputs?: unknown[] })?.outputs;
  if (!Array.isArray(outputs) || outputs.length === 0) return [];
  const first = outputs[0] as Record<string, unknown>;
  let preds: unknown = first["predictions"];
  // Some workflow outputs nest again: outputs[0].predictions.predictions
  if (preds && !Array.isArray(preds) && typeof preds === "object") {
    const inner = (preds as Record<string, unknown>)["predictions"];
    if (Array.isArray(inner)) preds = inner;
  }
  if (!Array.isArray(preds)) return [];
  return preds as Prediction[];
}

router.post(
  "/classify-plant",
  upload.single("image"),
  express.json({ limit: "50mb" }),
  async (req, res) => {
    const apiKey = process.env["ROBOFLOW_API_KEY"];
    if (!apiKey) {
      req.log.error("ROBOFLOW_API_KEY is not configured");
      res.status(500).json({
        error: "The plant identifier isn't set up yet. Missing ROBOFLOW_API_KEY.",
      });
      return;
    }

    // Accept either a multipart file upload (field "image") or a JSON body with imageBase64
    let imageBase64: string | undefined;
    if (req.file?.buffer) {
      imageBase64 = req.file.buffer.toString("base64");
    } else {
      const body = req.body as { imageBase64?: string } | undefined;
      imageBase64 = body?.imageBase64;
    }

    if (!imageBase64) {
      res.status(400).json({
        error: "No image was uploaded. Please take or choose a photo first.",
      });
      return;
    }

    try {
      const data = await callRoboflow(apiKey, imageBase64);
      req.log.info({ roboflow: stripImageBlobs(data) }, "Roboflow full response");

      const predictions = extractPredictions(data);
      if (predictions.length === 0) {
        res.status(200).json({
          predictions: [],
          error: "No plant could be identified in this photo. Try getting closer or improving the lighting.",
        });
        return;
      }

      const sorted = [...predictions].sort(
        (a, b) => (b.confidence ?? 0) - (a.confidence ?? 0)
      );
      const top = sorted[0];
      res.json({
        predictions: sorted,
        top: {
          class: top?.class ?? top?.label ?? "Unknown",
          confidence: top?.confidence ?? 0,
        },
      });
    } catch (err) {
      req.log.error({ err }, "Roboflow call failed");
      res.status(502).json({
        error: "Couldn't reach the plant identifier right now. Please try again in a moment.",
      });
    }
  }
);

export default router;
