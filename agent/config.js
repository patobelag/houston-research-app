// Configuración del agente de ElevenLabs para Félix Conversacional.
// La usa /api/setup-agent para crear o actualizar el agente.
// Las tools son "client tools": corren en el navegador (src/core.js) con datos de prueba.

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "bODdtoNp555Uj9jANhzI";
const LLM = process.env.ELEVENLABS_LLM || "claude-haiku-5-5";

const PROMPT = `Eres Félix, el asistente de voz de la app de Félix Pago. Hablas con migrantes latinos en Estados Unidos que envían dinero a su familia en México y Centroamérica.
Este es el prototipo de voz: el usuario habla contigo y, si prefiere, también puede escribir o tocar sugerencias. La pantalla muestra tarjetas de resumen.

# Personalidad
Cálido, claro y directo. Tratas de "tú". Máximo dos frases cortas por turno, menos de 30 palabras. Nada de tecnicismos.
La tarjeta en pantalla ya muestra los detalles. En voz di solo lo esencial y una sola pregunta. Ejemplo: "Tu mamá recibe 1,878 pesos. Son 102.99 dólares con comisión. ¿Lo envío?"
Respondes en el idioma del usuario: español latino o inglés.

# Contexto del usuario (datos de prueba)
{{user_context}}

# Lo que haces (solo esto)
1. Enviar una remesa, con calculadora.
   - Si pregunta cuánto llega o quiere comparar montos ("¿y si mando 200?"), usa show_quote. No mueve dinero.
   - Para enviar, usa prepare_transfer y pregunta "¿Lo envío?".
2. Cargar dinero a su cuenta Félix desde su tarjeta de débito o su banco: prepare_deposit.
3. Envía hoy, paga después: si el saldo no alcanza, prepare_transfer lo ofrece. Si lo pide directo, usa offer_pay_later. Di los pagos y pregunta si lo envía así. También puedes ofrecer cargar dinero como alternativa.
Acciones simples:
- Hablar con alguien del equipo (un ninja): pregunta primero si prefiere aquí en la app o por WhatsApp, luego usa talk_to_human con ese canal.
- Ver su perfil: show_profile.
- Conocer un producto (cuenta, tarjeta, paga después, crédito): show_product.
- Saldo: show_balance. Tipo de cambio: show_rates. Familiares guardados: list_recipients.
Si pide algo fuera de esto (congelar tarjeta, movimientos, pagar cuotas), di que en esta prueba no está y ofrece lo que sí puedes hacer.

# Dinero: siempre confirmar
- Llama confirm_pending SOLO después de un "sí" claro a la propuesta que acabas de leer. Si duda o dice que no, llama cancel_pending.
- Después de confirm_pending, confirma en una frase lo que pasó.
- Nunca inventes números. Usa siempre las herramientas.

# Límites
- Nunca pidas números de tarjeta, contraseñas, códigos ni números de seguro social.
- Si preguntan algo fuera de Félix, responde breve y regresa a cómo puedes ayudar.
- No des consejos de inversión.`;

const str = (description, extra = {}) => ({ type: "string", description, ...extra });
const num = (description) => ({ type: "number", description });
const obj = (properties, required = []) => ({ type: "object", properties, required });

const TOOLS = [
  {
    name: "show_quote",
    description: "Calculadora de remesas: muestra cuánto recibe la familia por un monto, con comisión y tipo de cambio. No mueve dinero. Úsala para comparar montos.",
    parameters: obj({
      recipient: str("Familiar opcional: mamá, papá, Ana, tío Carlos"),
      amount_usd: num("Monto en dólares"),
      amount_local: num("Monto en moneda local, si lo dijo en pesos o quetzales"),
      country: str("País si no hay familiar: MX, CO, GT o HN", { enum: ["MX", "CO", "GT", "HN"] }),
    }),
  },
  {
    name: "prepare_transfer",
    description: "Prepara un envío a un familiar guardado y muestra el resumen. No envía hasta confirm_pending. Si el saldo no alcanza, ofrece pagar después.",
    parameters: obj({
      recipient: str("Nombre, parentesco o id del familiar tal como lo dijo el usuario. Ejemplo: mamá, Ana, tío Carlos"),
      amount_usd: num("Monto en dólares, si lo dijo en dólares"),
      amount_local: num("Monto en moneda local (pesos, quetzales), si lo dijo así"),
    }, ["recipient"]),
  },
  {
    name: "offer_pay_later",
    description: "Envía hoy, paga después: envía hoy y paga en 4 pagos quincenales sin intereses. No envía hasta confirm_pending.",
    parameters: obj({ recipient: str("Nombre, parentesco o id del familiar"), amount_usd: num("Monto del envío en dólares") }, ["recipient", "amount_usd"]),
  },
  {
    name: "prepare_deposit",
    description: "Prepara cargar dinero a la cuenta Félix desde la tarjeta de débito (al instante) o el banco (1 a 3 días). No carga hasta confirm_pending.",
    parameters: obj({ amount_usd: num("Monto a cargar en dólares, de 10 a 2500"), source: str("debit o bank. Por defecto debit", { enum: ["debit", "bank"] }) }),
  },
  { name: "show_balance", description: "Muestra el saldo de la cuenta Félix y el crédito disponible." },
  { name: "show_rates", description: "Muestra el tipo de cambio de hoy por dólar." },
  { name: "list_recipients", description: "Lista los familiares guardados." },
  { name: "show_profile", description: "Muestra el perfil del usuario." },
  { name: "show_product", description: "Muestra un resumen de un producto Félix.", parameters: obj({ product: str("wallet, card, paylater o credit", { enum: ["wallet", "card", "paylater", "credit"] }) }, ["product"]) },
  { name: "talk_to_human", description: "Conecta con una persona del equipo Félix. Pregunta antes el canal.", parameters: obj({ channel: str("app o whatsapp", { enum: ["app", "whatsapp"] }) }, ["channel"]) },
  { name: "confirm_pending", description: "Ejecuta la acción pendiente (envío, paga después o carga). Solo tras un sí explícito." },
  { name: "cancel_pending", description: "Cancela la acción pendiente." },
];

function toolConfig(t) {
  const c = { type: "client", name: t.name, description: t.description, expects_response: true, response_timeout_secs: 10 };
  if (t.parameters) c.parameters = t.parameters;
  return c;
}

function agentBody({ toolIds, inlineTools } = {}) {
  const prompt = { prompt: PROMPT, llm: LLM, temperature: 0.3 };
  if (toolIds) prompt.tool_ids = toolIds;
  if (inlineTools) prompt.tools = TOOLS.map(toolConfig);
  return {
    name: "Félix Voz (prototipo offsite)",
    tags: ["felix", "prototipo", "houston"],
    conversation_config: {
      agent: {
        // El saludo llega como variable dinámica desde la app (no requiere permisos de override)
        first_message: "{{first_message}}",
        language: "es",
        dynamic_variables: {
          dynamic_variable_placeholders: {
            first_message: "Hola, soy Félix. Puedo enviar dinero a tu familia, cargar dinero a tu cuenta, o enviar hoy y que pagues después. ¿Qué necesitas?",
            user_context: "Usuario de prueba Juan, cuenta abierta, saldo $1,240.35.",
          },
        },
        prompt,
      },
      tts: { voice_id: VOICE_ID, expressive_mode: false },
      turn: { turn_eagerness: "patient" }, // push to talk: espera a que la persona toque "terminar"
      conversation: { max_duration_seconds: 600 },
    },
  };
}

module.exports = { VOICE_ID, LLM, PROMPT, TOOLS, toolConfig, agentBody };
