// GET /api/setup-agent?secret=TU_SETUP_SECRET
// Crea (o actualiza, si ya existe ELEVENLABS_AGENT_ID) el agente de Félix en ElevenLabs
// con el prompt, la voz y las client tools de agent/config.js.
// Protegido con SETUP_SECRET. Úsalo una vez, copia el agent_id a Vercel y listo.

const { agentBody, TOOLS, toolConfig, VOICE_ID, LLM } = require("../agent/config.js");
const API = "https://api.elevenlabs.io";

async function call(path, method, key, body) {
  const r = await fetch(API + path, {
    method,
    headers: { "xi-api-key": key, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch (e) {}
  return { ok: r.ok, status: r.status, json, text: text.slice(0, 1500) };
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const key = process.env.ELEVENLABS_API_KEY;
  const secret = process.env.SETUP_SECRET;
  if (!key) return res.status(503).json({ error: "Falta ELEVENLABS_API_KEY en Vercel" });
  if (!secret) return res.status(503).json({ error: "Falta SETUP_SECRET en Vercel" });
  if (!req.query || req.query.secret !== secret) return res.status(401).json({ error: "secret incorrecto" });

  // 1. Crear las client tools en el workspace
  const toolIds = [];
  let toolsError = null;
  for (const t of TOOLS) {
    const r = await call("/v1/convai/tools", "POST", key, { tool_config: toolConfig(t) });
    if (!r.ok || !r.json || !r.json.id) { toolsError = { tool: t.name, status: r.status, detail: r.text }; break; }
    toolIds.push(r.json.id);
  }

  // Si la API de tools falla, usamos tools en línea (formato anterior)
  const body = toolsError ? agentBody({ inlineTools: true }) : agentBody({ toolIds });

  // 2. Crear o actualizar el agente
  const existing = process.env.ELEVENLABS_AGENT_ID;
  let r = existing
    ? await call(`/v1/convai/agents/${encodeURIComponent(existing)}`, "PATCH", key, body)
    : await call("/v1/convai/agents/create", "POST", key, body);

  // Si ElevenLabs no acepta turn_timeout -1 (sin re-enganche), probamos con el máximo común (30 s)
  if (!r.ok && /turn_timeout/i.test(r.text)) {
    body.conversation_config.turn.turn_timeout = 30;
    r = existing
      ? await call(`/v1/convai/agents/${encodeURIComponent(existing)}`, "PATCH", key, body)
      : await call("/v1/convai/agents/create", "POST", key, body);
  }
  if (!r.ok) {
    return res.status(502).json({ error: "ElevenLabs rechazó la configuración", status: r.status, detail: r.text, toolsError });
  }
  const agentId = existing || (r.json && r.json.agent_id);
  return res.status(200).json({
    ok: true,
    action: existing ? "updated" : "created",
    agent_id: agentId,
    voice_id: VOICE_ID,
    llm: LLM,
    turn_timeout: body.conversation_config.turn.turn_timeout,
    tools: toolsError ? "inline" : toolIds.length,
    next: existing
      ? "Agente actualizado. No tienes que hacer nada más."
      : "Copia agent_id y guárdalo en Vercel como ELEVENLABS_AGENT_ID. Luego haz Redeploy.",
  });
};
