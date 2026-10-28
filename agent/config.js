// Configuración del agente de ElevenLabs para Félix Conversacional.
// La usa /api/setup-agent para crear o actualizar el agente.
// Las tools son "client tools": corren en el navegador (src/core.js) con datos de prueba.

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "bODdtoNp555Uj9jANhzI";
const LLM = process.env.ELEVENLABS_LLM || "claude-haiku-5-5";

const PROMPT = `Eres Félix, el asistente de voz de la app de Félix Pago. Hablas con migrantes latinos en Estados Unidos que envían dinero a su familia en México y Centroamérica.

# Personalidad
Cálido, claro y directo. Tratas de "tú". Frases cortas, máximo dos o tres por turno. Nada de tecnicismos.
Respondes en el idioma del usuario: español latino o inglés.

# Contexto del usuario (datos de prueba)
{{user_context}}

# Cómo trabajas
- Para cualquier dato (saldo, tipo de cambio, destinatarios, préstamo) usa una herramienta. Nunca inventes números.
- Cada herramienta muestra una tarjeta en la pantalla. Después de llamarla, resume en voz lo esencial. No leas toda la tarjeta.
- Di los montos de forma natural: "cien dólares", "mil ochocientos setenta y ocho pesos".
- Si falta un dato, pregunta solo por ese dato.

# Dinero: siempre confirmar
- Envíos: llama prepare_transfer. Si el resultado es "ready", di cuánto envía, cuánto recibe y el total, y pregunta "¿Lo envío?".
- Si el saldo no alcanza, prepare_transfer ofrece "Envía hoy, paga después". Explica los pagos y pregunta si lo envía así.
- Si el usuario pide pagar después de forma directa, usa offer_pay_later.
- Préstamos pequeños: usa offer_loan. Di monto, número de pagos, monto de cada pago y total a pagar.
- Cuotas del préstamo: usa prepare_installment_payment.
- Llama confirm_pending SOLO después de un "sí" claro del usuario a la propuesta que acabas de leer. Si duda o dice que no, llama cancel_pending.
- Después de confirm_pending, confirma en una frase lo que pasó.

# Usuario nuevo (account_open = false)
1. Pregunta a quién le envía dinero y en qué ciudad vive. Llama save_recipient.
2. Pregunta cada cuándo le pagan. Llama save_payday.
3. Llama prepare_open_account, explica que la cuenta es gratis con tarjeta de débito Visa y pregunta si la abre.
4. Tras confirmar, ofrece el primer envío. Con saldo cero, el envío sale con "Envía hoy, paga después".

# Otras acciones
- Congelar o descongelar tarjeta: set_card_frozen. Ver tarjeta: show_card.
- Saldo: show_balance. Tipo de cambio: show_rates. Movimientos: show_movements.
- Si pide hablar con una persona: talk_to_human.

# Límites
- Nunca pidas números de tarjeta, contraseñas, códigos ni números de seguro social.
- Si preguntan algo fuera de Félix, responde breve y regresa a cómo puedes ayudar.
- No des consejos de inversión.`;

const str = (description, extra = {}) => ({ type: "string", description, ...extra });
const num = (description) => ({ type: "number", description });
const obj = (properties, required = []) => ({ type: "object", properties, required });

const TOOLS = [
  { name: "show_balance", description: "Muestra el saldo de la cuenta Félix, la tarjeta y el crédito disponible." },
  { name: "show_rates", description: "Muestra el tipo de cambio de hoy por dólar para México, Colombia, Guatemala y Honduras.", parameters: obj({ country: str("Código de país opcional: MX, CO, GT o HN", { enum: ["MX", "CO", "GT", "HN"] }) }) },
  { name: "show_card", description: "Muestra la tarjeta de débito y si está congelada." },
  { name: "set_card_frozen", description: "Congela o descongela la tarjeta de débito.", parameters: obj({ frozen: { type: "boolean", description: "true para congelar, false para descongelar" } }, ["frozen"]) },
  { name: "show_movements", description: "Muestra los últimos movimientos de la cuenta." },
  { name: "list_recipients", description: "Lista los familiares guardados a quienes el usuario envía dinero." },
  {
    name: "prepare_transfer",
    description: "Prepara un envío de dinero a un familiar guardado y muestra el resumen. No envía nada hasta confirm_pending. Si el saldo no alcanza, ofrece pagar después.",
    parameters: obj({
      recipient: str("Nombre, parentesco o id del familiar tal como lo dijo el usuario. Ejemplo: mamá, Ana, tío Carlos"),
      amount_usd: num("Monto en dólares, si el usuario lo dijo en dólares"),
      amount_local: num("Monto en moneda local (pesos, quetzales), si el usuario lo dijo así"),
    }, ["recipient"]),
  },
  {
    name: "offer_pay_later",
    description: "Ofrece 'Envía hoy, paga después': envía hoy y el usuario paga en 4 pagos quincenales. No envía nada hasta confirm_pending.",
    parameters: obj({ recipient: str("Nombre, parentesco o id del familiar"), amount_usd: num("Monto del envío en dólares") }, ["recipient", "amount_usd"]),
  },
  {
    name: "offer_loan",
    description: "Ofrece un crédito de consumo de bajo monto depositado a la cuenta. No deposita nada hasta confirm_pending. Sin monto, devuelve el máximo disponible.",
    parameters: obj({ amount_usd: num("Monto del préstamo en dólares"), months: num("Plazo en meses, por defecto 3") }),
  },
  { name: "prepare_installment_payment", description: "Prepara el pago de la siguiente cuota del préstamo activo. No paga hasta confirm_pending." },
  {
    name: "save_recipient",
    description: "Guarda un familiar nuevo durante el registro.",
    parameters: obj({
      relation: str("Parentesco", { enum: ["mama", "papa", "hermana", "hermano", "esposa", "esposo", "hija", "hijo", "abuela", "abuelo", "tia", "tio"] }),
      name: str("Nombre de la persona, si lo dijo"),
      city: str("Ciudad donde vive"),
    }, ["relation"]),
  },
  { name: "save_payday", description: "Guarda cada cuándo le pagan al usuario.", parameters: obj({ payday: str("Frecuencia de pago en palabras, ejemplo: Cada viernes, Cada quince días") }, ["payday"]) },
  { name: "prepare_open_account", description: "Prepara la apertura de la cuenta Félix gratis con tarjeta de débito. No abre nada hasta confirm_pending." },
  { name: "talk_to_human", description: "Conecta al usuario con una persona del equipo Félix." },
  { name: "confirm_pending", description: "Ejecuta la acción pendiente (envío, pago, préstamo o apertura de cuenta). Úsala solo tras un sí explícito del usuario." },
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
    name: "Félix Conversacional (prototipo)",
    tags: ["felix", "prototipo", "houston"],
    conversation_config: {
      agent: {
        // El saludo llega como variable dinámica desde la app (no requiere permisos de override)
        first_message: "{{first_message}}",
        language: "es",
        dynamic_variables: {
          dynamic_variable_placeholders: {
            first_message: "Hola, soy Félix. ¿Qué necesitas hoy?",
            user_context: "Usuario de prueba Juan, cuenta abierta, saldo $1,240.35.",
          },
        },
        prompt,
      },
      tts: { voice_id: VOICE_ID },
      turn: { turn_eagerness: "normal" },
      conversation: { max_duration_seconds: 600 },
    },
  };
}

module.exports = { VOICE_ID, LLM, PROMPT, TOOLS, toolConfig, agentBody };
