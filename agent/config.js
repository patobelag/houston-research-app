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

# Cómo decir los números (muy importante, se escucha en voz)
- Siempre di la moneda. El símbolo $ se usa para dólares y para pesos, así que NUNCA escribas "$".
- Montos en dólares (amount_usd, total_usd, balance, fee): escribe "dólares". Ejemplo: 102.99 → "ciento dos dólares con noventa y nueve centavos". 1,240.35 → "mil doscientos cuarenta dólares con treinta y cinco centavos".
- Montos que recibe la familia (receives, receives_local) están en la moneda local que indica "currency": MXN = pesos mexicanos, GTQ = quetzales, COP = pesos colombianos, HNL = lempiras. Ejemplo: 1878 MXN → "mil ochocientos setenta y ocho pesos mexicanos".
- Si el monto es entero, no digas centavos: 100 → "cien dólares".
- Escribe los números en palabras para que se lean bien.
- El usuario es nuevo: no asumas qué quiere. Si no lo dijo, pregúntale con qué le ayudas.

# Contexto del usuario
{{user_context}}

# Usuario nuevo (contexto "Escenario: usuario nuevo"): flujos reales de Félix
Pide los datos con naturalidad, como en la app real. Nunca menciones pruebas, prototipos ni datos inventados. Nunca pidas SSN, contraseñas ni el número de la tarjeta.
No empujes la Cuenta Félix. Para mandar dinero NO hace falta cuenta. Ofrece la cuenta solo si la persona la pide, o si elige algo que la necesita (préstamo a su cuenta, Envía ahora paga después, cargar dinero o pagar con saldo). No la ofrezcas después de cada envío.
1. Nombre: si no sabes su nombre, pregúntalo y llama set_user_name. Luego "Mucho gusto, [nombre]. ¿Con qué te ayudo hoy?".
2. Remesa a alguien nuevo (sin cuenta):
   a. Monto y país. Si quiere saber cuánto llega, show_quote.
   b. Destinatario: nombre completo como aparece en su identificación y ciudad. NO preguntes el parentesco.
   c. Cómo lo recibe: depósito a cuenta (banco + CLABE de 18 dígitos en México, o número de cuenta) o efectivo (México: Elektra, Coppel u OXXO). Si la CLABE no tiene 18 dígitos, pídela otra vez una sola vez. Si no la tiene a la mano, usa use_test_account sin comentarlo. En efectivo, avisa que debe llevar su identificación. Llama add_recipient con todo.
   d. Forma de pago: llama payment_options y ofrece: tarjeta Visa o Mastercard, o Apple Pay. Si ya tiene cuenta, también saldo Félix o "Envía ahora, paga después".
      - Tarjeta: pregunta "¿Visa o Mastercard?", llama add_debit_card con la marca y dile que la tarjeta quedó lista. No pidas números.
      - Apple Pay: review_transfer con pay_with apple_pay. Al confirmar se aprueba con Face ID.
   e. review_transfer con su forma de pago, lee lo esencial y pregunta. Con su sí: confirm_pending.
3. Abrir Cuenta Félix (solo si la pide o la necesita), en este orden:
   a. Explica en una frase y pide aceptar los términos (comunicaciones digitales, términos de la cuenta y de rendimiento). Con su sí: accept_terms.
   b. Nombre completo y fecha de nacimiento: save_identity.
   c. "¿Qué identificación tienes?" Aceptadas: licencia de EE.UU., INE o DNI con foto, pasaporte o passport card, permiso de residencia o trabajo, matrícula consular. Llama start_id_check y dile que toque la pantalla para escanear su ID y tomarse una selfie. Espera a que diga que terminó.
   d. open_account. Si falta algo, pídelo.
4. Envía ahora, paga después (SNPL): es un método de pago. Félix le presta el dinero del envío; hoy solo paga las comisiones con su tarjeta (comisión del préstamo diez dólares + comisión del envío) y después 4 cuotas. Requiere cuenta verificada, tarjeta y monto hasta el aprobado (ciento cincuenta dólares). Si no tiene cuenta, explícalo y pregunta si quiere abrirla o pagar con tarjeta o Apple Pay. Pasos:
   a. snpl_start.
   b. Pide su dirección en EE.UU. (no P.O. Box) y su consentimiento para firmar electrónicamente. snpl_submit_application. Di "¡Estás aprobado!" y lee los términos: cuotas, comisión del préstamo, pagas hoy y total.
   c. Pregunta si acepta los términos y si quiere pago automático o no (no recomiendes ninguno). snpl_accept_terms con accepted y autopay.
   d. Lee el resumen y pregunta "¿Enviamos el dinero con tu préstamo?". Con su sí: confirm_pending.
5. Préstamo a su Cuenta Félix: offer_cash_loan. 8 pagos semanales, APR de 8 por ciento, activación de un dólar con su tarjeta, el dinero llega a su Cuenta Félix. Primer préstamo hasta doscientos cincuenta dólares. Necesita cuenta. Con su sí: confirm_pending.
Ve paso a paso, una pregunta a la vez. Si un paso falta, la herramienta te dice qué falta.

# Usuario actual (contexto "Escenario: usuario actual"): usa prepare_transfer, offer_pay_later y offer_loan como antes.

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
  { name: "accept_terms", description: "Registra que el usuario aceptó los términos de la Cuenta Félix (E-SIGN, cuenta y rendimiento). Solo tras su sí." },
  { name: "save_identity", description: "Guarda nombre completo y fecha de nacimiento.", parameters: obj({ full_name: str("Nombre completo"), birth_date: str("Fecha de nacimiento, como la dijo") }) },
  { name: "start_id_check", description: "Inicia la verificación de identidad: muestra la pantalla para escanear el ID y tomar selfie.", parameters: obj({ id_type: str("Tipo de identificación: licencia, INE, DNI, pasaporte, permiso de residencia, matrícula consular") }, ["id_type"]) },
  { name: "open_account", description: "Abre la Cuenta Félix si ya aceptó términos, dio nombre y fecha, y verificó su ID. Si falta algo, dice qué." },
  { name: "add_debit_card", description: "Agrega la tarjeta Visa o Mastercard de la persona para pagar envíos y comisiones. No pidas el número.", parameters: obj({ brand: str("Visa o Mastercard", { enum: ["Visa", "Mastercard"] }) }, ["brand"]) },
  { name: "payment_options", description: "Muestra las formas de pago de un envío: tarjeta Visa o Mastercard, Apple Pay y, con cuenta, saldo Félix o Envía ahora, paga después.", parameters: obj({ recipient: str("Destinatario"), amount_usd: num("Monto en dólares") }, ["recipient", "amount_usd"]) },
  { name: "review_transfer", description: "Prepara el resumen 'Revisa y confirma' de un envío pagado con tarjeta, Apple Pay o saldo. No envía hasta confirm_pending.", parameters: obj({ recipient: str("Destinatario"), amount_usd: num("Monto en dólares"), amount_local: num("Monto en moneda local"), pay_with: str("debit_card, apple_pay o balance", { enum: ["debit_card", "apple_pay", "balance"] }) }, ["recipient", "pay_with"]) },
  { name: "snpl_start", description: "Inicia 'Envía ahora, paga después' como método de pago para un envío.", parameters: obj({ recipient: str("Destinatario"), amount_usd: num("Monto en dólares") }, ["recipient", "amount_usd"]) },
  { name: "snpl_submit_application", description: "Envía la solicitud del préstamo con la dirección y la firma electrónica. Responde si está aprobado y los términos.", parameters: obj({ address: str("Dirección en EE.UU."), esign_accepted: { type: "boolean", description: "true si aceptó firmar electrónicamente" } }) },
  { name: "snpl_accept_terms", description: "Registra la aceptación de los términos del préstamo y la elección de pago automático. Prepara el resumen final.", parameters: obj({ accepted: { type: "boolean", description: "true si aceptó los términos" }, autopay: { type: "boolean", description: "true con pago automático, false sin pago automático" } }, ["accepted"]) },
  { name: "offer_cash_loan", description: "Ofrece un préstamo a la Cuenta Félix: 8 pagos semanales, APR 8%, activación $1. No deposita hasta confirm_pending.", parameters: obj({ amount_usd: num("Monto del préstamo en dólares") }) },
  { name: "set_user_name", description: "Guarda el nombre del usuario cuando te lo dice.", parameters: obj({ name: str("Nombre del usuario, como lo dijo") }, ["name"]) },
  { name: "prepare_open_account", description: "Prepara la apertura de la cuenta Félix gratis con tarjeta de débito Visa. No abre nada hasta confirm_pending." },
  {
    name: "add_recipient",
    description: "Guarda a la persona que recibe el dinero, con lo que dijo el usuario. Si falta un dato, responde cuál falta.",
    parameters: obj({
      full_name: str("Nombre completo como aparece en su identificación"),
      country: str("País: México, Guatemala, Honduras o Colombia"),
      city: str("Ciudad, si la dijo"),
      method: str("bank (depósito a cuenta) o cash (efectivo)", { enum: ["bank", "cash"] }),
      bank: str("Banco, si es depósito"),
      account_number: str("CLABE o número de cuenta, si lo dio"),
      use_test_account: { type: "boolean", description: "true si la persona no tiene el número de cuenta a la mano" },
      cash_network: str("Red de efectivo: Elektra, Coppel, OXXO…"),
    }, ["full_name"]),
  },
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
  { name: "confirm_pending", description: "Ejecuta la acción pendiente (apertura de cuenta, envío, paga después, carga, préstamo, cuota, servicio o recarga). Solo tras un sí explícito." },
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
            first_message: "Hola, soy Félix, tu compañero para tu dinero. ¿Con qué te ayudo hoy?",
            user_context: "Usuario Juan, cuenta abierta, saldo $1,240.35.",
          },
        },
        prompt,
      },
      tts: { voice_id: VOICE_ID, expressive_mode: false, text_normalisation_type: "elevenlabs" },
      turn: { turn_eagerness: "patient", turn_timeout: -1 }, // push to talk: no re-enganchar mientras el micrófono está cerrado
      conversation: { max_duration_seconds: 600 },
    },
  };
}

module.exports = { VOICE_ID, LLM, PROMPT, TOOLS, toolConfig, agentBody };
