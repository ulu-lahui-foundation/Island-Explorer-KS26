import { Router } from "express";
import express from "express";

const router = Router();

const ROBOFLOW_URL =
  "https://serverless.roboflow.com/aina-intelligence-lab/workflows/plant-photo-classifier-1782571434374";

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
      const rfRes = await fetch(ROBOFLOW_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          inputs: {
            image: { type: "base64", value: imageBase64 },
          },
        }),
      });

      const text = await rfRes.text();

      if (!rfRes.ok) {
        req.log.error({ status: rfRes.status, body: text }, "Roboflow error");
        res.status(rfRes.status).json({ error: "Roboflow request failed", detail: text });
        return;
      }

      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch {
        req.log.error({ text }, "Roboflow non-JSON response");
        res.status(502).json({ error: "Roboflow returned non-JSON", detail: text });
        return;
      }

      // Log a stripped summary — exclude output_image base64 blobs so the prediction is readable
      try {
        const d = data as Record<string, unknown>;
        const outputs = Array.isArray(d?.outputs)
          ? (d.outputs as Record<string, unknown>[]).map((o) => {
              const stripped: Record<string, unknown> = {};
              for (const [k, v] of Object.entries(o)) {
                if (k === "output_image") {
                  stripped[k] = "<base64 image omitted>";
                } else {
                  stripped[k] = v;
                }
              }
              return stripped;
            })
          : d?.outputs;
        req.log.info({ outputs }, "Roboflow prediction");
      } catch {
        req.log.info({ data }, "Roboflow response (raw)");
      }

      res.json(data);
    } catch (err) {
      req.log.error({ err }, "Failed to reach Roboflow");
      res.status(502).json({ error: "Failed to reach Roboflow" });
    }
  }
);

export default router;
