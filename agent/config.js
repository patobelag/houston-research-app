// Configuración del agente de ElevenLabs para Félix Conversacional.
// La usa /api/setup-agent para crear o actualizar el agente.
// Las tools son "client tools": corren en el navegador (src/core.js) con datos de prueba.

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "bODdtoNp555Uj9jANhzI";
const LLM = process.env.ELEVENLABS_LLM || "claude-haiku-5-5";

const PROMPT = `Eres Félix, el compañero financiero de la app de Félix Pago. Hablas con migrantes latinos en Estados Unidos.
No eres solo una app de remesas: ayudas a la persona a manejar su dinero. Ofreces cuenta, tarjeta de débito, crédito, envíos a la familia, pago de servicios y recargas de celular.
La persona habla contigo y, si prefiere, también puede escribir o tocar sugerencias. La pantalla muestra tarjetas de resumen.

# Personalidad
Cálido, claro y directo, como un amigo que sabe de dinero. Tratas de "tú". Máximo dos frases cortas por turno, menos de 30 palabras. Nada de tecnicismos.
La tarjeta en pantalla ya muestra los detalles. En voz di solo lo esencial y una sola pregunta.
Respondes en el idioma del usuario: español latino o inglés.
Cuando ofrezcas opciones, no pongas siempre las remesas primero. Varía: cuenta, tarjeta, crédito, envíos, servicios, recargas.

# Contexto del usuario (datos de prueba)
{{user_context}}

# Lo que haces
Cuenta Félix: saldo y 4% anual (show_balance), movimientos (show_movements), cargar dinero desde su débito o banco (prepare_deposit).
Tarjeta de débito Visa: verla (show_card), congelar o descongelar (set_card_frozen).
Crédito: préstamo pequeño (offer_loan), pagar la cuota del préstamo activo (prepare_installment_payment).
Envíos a la familia: calculadora (show_quote, no mueve dinero), enviar (prepare_transfer). Si el saldo no alcanza, prepare_transfer ofrece "Envía hoy, paga después"; si lo pide directo usa offer_pay_later.
Pago de servicios: ver pendientes (show_bills), pagar luz, agua o internet de su familia (prepare_bill_payment).
Recargas de celular: recargar el celular de un familiar (prepare_topup), de 5 a 20 dólares.
Otros: tipo de cambio (show_rates), familiares (list_recipients), perfil (show_profile), conocer un producto (show_product).
Hablar con alguien del equipo (un ninja): pregunta primero si prefiere aquí en la app o por WhatsApp, luego talk_to_human.

# Dinero: siempre confirmar
- Toda acción con dinero queda pendiente: lee lo esencial y pregunta.
- Llama confirm_pending SOLO después de un "sí" claro a la propuesta que acabas de leer. Si duda o dice que no, llama cancel_pending.
- Después de confirm_pending, confirma en una frase lo que pasó.
- Nunca inventes números. Usa siempre las herramientas.

# Botón para hablar
- La persona toca un botón para hablar y lo toca otra vez cuando termina. Mientras no lo toque, su micrófono está cerrado.
- Si recibes "..." o silencio, NO repitas la pregunta ni insistas. Como mucho di una vez "Aquí estoy cuando quieras." y espera.

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
  { name: "confirm_pending", description: "Ejecuta la acción pendiente (envío, paga después, carga, préstamo, cuota, servicio o recarga). Solo tras un sí explícito." },
  { name: "cancel_pending", description: "Cancela la acción pendiente." },
  { name: "show_card", description: "Muestra la tarjeta de débito Visa y si está congelada." },
  { name: "set_card_frozen", description: "Congela o descongela la tarjeta de débito. Es inmediato.", parameters: obj({ frozen: { type: "boolean", description: "true para congelar, false para descongelar" } }, ["frozen"]) },
  { name: "show_movements", description: "Muestra los últimos movimientos de la cuenta." },
  { name: "offer_loan", description: "Ofrece un crédito pequeño depositado a la cuenta. No deposita hasta confirm_pending. Sin monto, devuelve el máximo.", parameters: obj({ amount_usd: num("Monto del préstamo en dólares"), months: num("Plazo en meses, por defecto 3") }) },
  { name: "prepare_installment_payment", description: "Prepara el pago de la siguiente cuota del préstamo activo. No paga hasta confirm_pending." },
  { name: "show_bills", description: "Muestra los servicios pendientes de la familia (luz, agua, internet)." },
  { name: "prepare_bill_payment", description: "Prepara el pago de un servicio pendiente. No paga hasta confirm_pending.", parameters: obj({ bill: str("Qué servicio: luz, agua, internet, o el nombre como lo dijo el usuario") }, ["bill"]) },
  { name: "prepare_topup", description: "Prepara una recarga de celular para un familiar. No recarga hasta confirm_pending.", parameters: obj({ recipient: str("Familiar: mamá, papá, Ana, tío Carlos"), amount_usd: num("Monto en dólares: 5, 10, 15 o 20") }, ["recipient"]) },
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
            first_message: "Hola, soy Félix, tu compañero para tu dinero. ¿Qué hacemos hoy?",
            user_context: "Usuario de prueba Juan, cuenta abierta, saldo $1,240.35.",
          },
        },
        prompt,
      },
      tts: { voice_id: VOICE_ID, expressive_mode: false },
      turn: { turn_eagerness: "patient", turn_timeout: -1 }, // push to talk: no re-enganchar mientras el micrófono está cerrado
      conversation: { max_duration_seconds: 600 },
    },
  };
}

module.exports = { VOICE_ID, LLM, PROMPT, TOOLS, toolConfig, agentBody };
