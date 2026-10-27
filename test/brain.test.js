// Prueba los flujos del cerebro demo sin navegador: node test/brain.test.js
require("../src/core.js");
const C = globalThis.FelixCore;
let fails = 0;

function session(scenario, lang = "es") {
  const state = C.seedState(scenario);
  const cards = []; const timers = []; const notes = [];
  const hooks = {
    lang: () => lang,
    card: (type, data) => { const id = "c" + cards.length; cards.push({ id, type, data }); return id; },
    update: (id, patch) => { const c = cards.find((x) => x.id === id); if (c) Object.assign(c, patch); },
    later: (ms, fn) => timers.push(fn),
    notify: (t) => notes.push(t[lang]),
  };
  const tools = C.makeTools(state, hooks);
  const brain = C.makeBrain(state, tools, () => lang);
  const log = [];
  const say = (txt) => { const out = brain.handle(txt); log.push(["U", txt], ["F", out]); return out; };
  return { state, cards, timers, notes, brain, say, log, flush: () => timers.splice(0).forEach((f) => f()) };
}
function check(name, cond, extra) { if (!cond) { fails++; console.log("✗", name, extra || ""); } else console.log("✓", name); }
const last = (s) => s.cards[s.cards.length - 1].type;

// 1. Envío completo en una frase
let s = session("steady");
s.brain.greet();
let o = s.say("Mándale 100 dólares a mi mamá");
check("envío listo pide confirmación", /Lo envío/.test(o) && last(s) === "send", o);
o = s.say("sí, dale");
check("envío confirmado", /camino/.test(o) && last(s) === "tracking" && s.state.account.balance === 1137.36, o + " " + s.state.account.balance);
s.flush();
check("aviso de entrega", /llegó/.test(s.notes[0] || ""), s.notes[0]);

// 2. Envío por pasos
s = session("steady");
o = s.say("quiero enviar dinero");
check("pide destinatario", /A quién/.test(o), o);
o = s.say("a Ana");
check("pide monto", /Cuánto/.test(o), o);
o = s.say("ciento cincuenta");
check("monto en palabras", /150 dólares/.test(o), o);
o = s.say("no, cancela");
check("cancelar", /Cancelado/.test(o) && s.state.pending === null, o);

// 3. Pesos
s = session("steady");
o = s.say("mándale 2000 pesos a mi papá");
check("monto en pesos", /2,000 pesos/.test(o), o);

// 4. Saldo insuficiente → paga después
s = session("steady");
o = s.say("envíale 1300 a mi mamá");
check("insuficiente ofrece paga después o límite", /pagas después|límite/.test(o), o);
o = s.say("mándale 300 a ana");
s = session("steady"); s.state.account.balance = 40;
o = s.say("mándale 100 a mi mamá");
check("paga después ofrecido", /pagas después/.test(o) && last(s) === "paylater", o);
o = s.say("sí");
check("paga después confirmado", /camino/.test(o) && s.state.credit.used > 0, o);

// 5. Crédito
s = session("steady");
o = s.say("necesito un préstamo");
check("crédito pide monto", /Cuánto necesitas/.test(o), o);
o = s.say("200");
check("crédito oferta", /Te presto 200/.test(o) && last(s) === "loan_offer", o);
o = s.say("acepto");
check("crédito desembolsado", /Ya tienes 200/.test(o) && s.state.account.balance === 1440.35, o);

// 6. Cuota
s = session("steady");
o = s.say("quiero pagar mi préstamo");
check("cuota pide confirmación", /pago 3 de 4/.test(o), o);
o = s.say("sí"); check("cuota pagada", /Llevas 3 de 4/.test(o), o);
s.say("paga mi cuota"); o = s.say("sí"); check("préstamo liquidado", /Terminaste/.test(o) && last(s) === "loan_paid_off", o);

// 7. Tarjeta, saldo, tipo de cambio, movimientos, persona
s = session("steady");
check("congelar", /Congelé/.test(s.say("congela mi tarjeta")) && s.state.account.card.frozen);
check("descongelar", /funciona/.test(s.say("descongela mi tarjeta")) && !s.state.account.card.frozen);
check("saldo", /1,240.35/.test(s.say("¿cuánto tengo?")));
check("tipo de cambio", /18.78/.test(s.say("¿a cómo está el dólar hoy?")));
check("movimientos", last(s) === "rates" && /movimientos/.test(s.say("muéstrame mis movimientos")));
check("persona", /Lucía/.test(s.say("quiero hablar con una persona")));

// 8. Onboarding
s = session("new");
o = s.brain.greet();
check("onboarding saludo", /a quién/.test(o), o);
o = s.say("a mi mamá");
check("pide ciudad", /ciudad/.test(o), o);
o = s.say("en Guadalajara");
check("guarda destinatario", /Guardé a tu mamá en Guadalajara/.test(o), o);
o = s.say("me pagan cada viernes");
check("guarda día de pago y ofrece cuenta", /viernes/.test(o) && /La abro/.test(o), o);
o = s.say("sí");
check("cuenta abierta", /abierta/.test(o) && s.state.account.open, o);
o = s.say("sí, 100 dólares");
check("primer envío con paga después", /pagas después/.test(o), o);
o = s.say("dale");
check("primer envío confirmado", /camino/.test(o), o);

// 9. Onboarding en una frase + inglés
s = session("new", "en");
s.brain.greet();
o = s.say("my mom in Bogota");
check("EN onboarding", /saved your mom in Bogotá/.test(o), o);
s = session("steady", "en");
o = s.say("send a hundred dollars to my sister");
check("EN envío", /\$100 to your sister/.test(o), o);

console.log(fails ? `\n${fails} fallas` : "\nTodo bien");
process.exit(fails ? 1 : 0);
