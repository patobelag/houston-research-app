// POST /api/stt  (cuerpo: audio de la nota de voz, application/octet-stream) → { text }
// Transcribe con ElevenLabs Speech-to-Text. El audio no se guarda.
// Usa la misma ELEVENLABS_API_KEY y el mismo ACCESS_CODE que /api/el-token.

const MAX_BYTES = 4 * 1024 * 1024; // Vercel limita el cuerpo a 4.5 MB

async function readBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const key = process.env.ELEVENLABS_API_KEY;
  const access = process.env.ACCESS_CODE;
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!key) return res.status(503).json({ error: "not_configured" });
  if (access && req.headers["x-access-code"] !== access) return res.status(401).json({ error: "bad_code" });

  // Solo desde nuestra propia página
  const origin = req.headers.origin || req.headers.referer || "";
  const host = req.headers.host || "";
  if (origin && host && !origin.includes(host)) return res.status(403).json({ error: "bad_origin" });

  const audio = await readBody(req);
  if (!audio.length) return res.status(400).json({ error: "empty" });
  if (audio.length > MAX_BYTES) return res.status(413).json({ error: "too_large" });

  const type = String(req.headers["x-audio-type"] || "audio/webm");
  const form = new FormData();
  form.append("model_id", process.env.ELEVENLABS_STT_MODEL || "scribe_v1");
  form.append("language_code", "es");
  form.append("tag_audio_events", "false");
  form.append("file", new Blob([audio], { type }), "nota" + (type.includes("mp4") ? ".mp4" : ".webm"));

  try {
    const r = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": key },
      body: form,
    });
    if (!r.ok) {
      const detail = await r.text();
      return res.status(502).json({ error: "elevenlabs_error", status: r.status, detail: detail.slice(0, 400) });
    }
    const data = await r.json();
    return res.status(200).json({ text: String(data.text || "").trim() });
  } catch (e) {
    return res.status(502).json({ error: "network_error" });
  }
};
