// GET /api/el-token
// Entrega un token temporal de conversación (WebRTC) de ElevenLabs.
// La API key vive solo en Vercel (ELEVENLABS_API_KEY) y nunca llega al navegador.
// ?check=1 solo responde si el servidor está configurado, sin gastar créditos.
// Si defines ACCESS_CODE en Vercel, el navegador debe mandar el mismo código (link ?code=...).

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const key = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  const access = process.env.ACCESS_CODE;
  const configured = Boolean(key && agentId);

  if (req.query && req.query.check) {
    return res.status(200).json({ configured, needsCode: Boolean(access) });
  }
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });
  if (!configured) return res.status(503).json({ error: "not_configured" });
  if (access && req.headers["x-access-code"] !== access) return res.status(401).json({ error: "bad_code" });

  // Solo desde nuestra propia página
  const origin = req.headers.origin || req.headers.referer || "";
  const host = req.headers.host || "";
  if (origin && host && !origin.includes(host)) return res.status(403).json({ error: "bad_origin" });

  try {
    const r = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${encodeURIComponent(agentId)}`, {
      headers: { "xi-api-key": key },
    });
    if (!r.ok) {
      const detail = await r.text();
      return res.status(502).json({ error: "elevenlabs_error", status: r.status, detail: detail.slice(0, 400) });
    }
    const body = await r.json();
    return res.status(200).json({ token: body.token });
  } catch (e) {
    return res.status(502).json({ error: "network_error" });
  }
};
