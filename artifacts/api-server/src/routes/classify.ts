import { Router } from "express";
import express from "express";

const router = Router();

const ROBOFLOW_URL =
  "https://serverless.roboflow.com/aina-intelligence-lab/workflows/plant-identification-app-20-v6-logic";

const RETRY_ATTEMPTS = 2;
const TIMEOUT_MS = 20_000;

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
      const err = new Error(`Roboflow HTTP ${rfRes.status}: ${text}`);
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
      (err instanceof Error &&
        (err.name === "AbortError" ||
          (err as NodeJS.ErrnoException).code === "ECONNRESET" ||
          (err as NodeJS.ErrnoException).code === "503" ||
          (err as NodeJS.ErrnoException).code === "429"));

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

router.post(
  "/classify-plant",
  express.json({ limit: "50mb" }),
  async (req, res) => {
    const apiKey = process.env["ROBOFLOW_API_KEY"];
    if (!apiKey) {
      res.status(500).json({ error: "ROBOFLOW_API_KEY not configured" });
      return;
    }

    const { imageBase64 } = req.body as { imageBase64?: string };
    if (!imageBase64) {
      res.status(400).json({ error: "imageBase64 is required" });
      return;
    }

    try {
      const data = await callRoboflow(apiKey, imageBase64);
      req.log.info({ outputs: stripImageBlobs(data) }, "Roboflow prediction");
      res.json(data);
    } catch (err) {
      req.log.error({ err }, "Roboflow call failed");
      res.status(502).json({ error: "Failed to reach Roboflow", detail: String(err) });
    }
  }
);

export default router;
