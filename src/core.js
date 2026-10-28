/* Félix Conversacional · core
   Datos de prueba, herramientas (tools) y cerebro demo.
   Las tools son las mismas que usará el agente de ElevenLabs (fase 2).
   Sin DOM: se prueba con node (test/brain.test.js). */
(function (g) {
  "use strict";

  // ───────────────────────── Configuración (valores de prueba) ─────────────────────────
  const CONFIG = {
    fee: 2.99, // comisión por envío, USD
    rates: {
      MX: { cur: "MXN", rate: 18.78, sym: "$", unit: { es: "pesos", en: "pesos" }, name: { es: "México", en: "Mexico" }, flag: "🇲🇽" },
      CO: { cur: "COP", rate: 3172, sym: "$", unit: { es: "pesos colombianos", en: "Colombian pesos" }, name: { es: "Colombia", en: "Colombia" }, flag: "🇨🇴" },
      GT: { cur: "GTQ", rate: 7.64, sym: "Q", unit: { es: "quetzales", en: "quetzales" }, name: { es: "Guatemala", en: "Guatemala" }, flag: "🇬🇹" },
      HN: { cur: "HNL", rate: 26.87, sym: "L", unit: { es: "lempiras", en: "lempiras" }, name: { es: "Honduras", en: "Honduras" }, flag: "🇭🇳" },
    },
    payLater: { fee: 4.99, payments: 4, everyDays: 14 }, // Envía hoy, paga después
    loan: { monthlyRate: 0.05, defaultMonths: 3, min: 50 }, // Crédito de consumo de bajo monto
    apy: 4,
    delivery: { onTheWayMs: 6000, deliveredMs: 18000 },
  };

  const CITIES = [
    ["ciudad de mexico", "MX", "Ciudad de México"], ["cdmx", "MX", "Ciudad de México"], ["df", "MX", "Ciudad de México"],
    ["guadalajara", "MX", "Guadalajara"], ["monterrey", "MX", "Monterrey"], ["puebla", "MX", "Puebla"], ["morelia", "MX", "Morelia"],
    ["oaxaca", "MX", "Oaxaca"], ["michoacan", "MX", "Michoacán"], ["jalisco", "MX", "Jalisco"], ["guanajuato", "MX", "Guanajuato"],
    ["leon", "MX", "León"], ["zacatecas", "MX", "Zacatecas"], ["veracruz", "MX", "Veracruz"], ["tijuana", "MX", "Tijuana"],
    ["acapulco", "MX", "Acapulco"], ["queretaro", "MX", "Querétaro"], ["chiapas", "MX", "Chiapas"], ["guerrero", "MX", "Guerrero"],
    ["mexico", "MX", "México"],
    ["bogota", "CO", "Bogotá"], ["medellin", "CO", "Medellín"], ["cali", "CO", "Cali"], ["colombia", "CO", "Colombia"],
    ["quetzaltenango", "GT", "Quetzaltenango"], ["xela", "GT", "Quetzaltenango"], ["guatemala", "GT", "Guatemala"],
    ["tegucigalpa", "HN", "Tegucigalpa"], ["san pedro sula", "HN", "San Pedro Sula"], ["honduras", "HN", "Honduras"],
  ];

  const RELATIONS = [
    { key: "mama", re: /\b(mama|mami|madre|mamita|amá|ama|mom|mommy|mother)\b/, label: { es: "Mamá", en: "Mom" }, poss: { es: "tu mamá", en: "your mom" } },
    { key: "papa", re: /\b(papa|papi|padre|apa|dad|daddy|father)\b/, label: { es: "Papá", en: "Dad" }, poss: { es: "tu papá", en: "your dad" } },
    { key: "hermana", re: /\b(hermana|hermanita|sis|sister)\b/, label: { es: "Hermana", en: "Sister" }, poss: { es: "tu hermana", en: "your sister" } },
    { key: "hermano", re: /\b(hermano|hermanito|brother|bro)\b/, label: { es: "Hermano", en: "Brother" }, poss: { es: "tu hermano", en: "your brother" } },
    { key: "esposa", re: /\b(esposa|wife)\b/, label: { es: "Esposa", en: "Wife" }, poss: { es: "tu esposa", en: "your wife" } },
    { key: "esposo", re: /\b(esposo|marido|husband)\b/, label: { es: "Esposo", en: "Husband" }, poss: { es: "tu esposo", en: "your husband" } },
    { key: "hija", re: /\b(hija|daughter)\b/, label: { es: "Hija", en: "Daughter" }, poss: { es: "tu hija", en: "your daughter" } },
    { key: "hijo", re: /\b(hijo|my son)\b/, label: { es: "Hijo", en: "Son" }, poss: { es: "tu hijo", en: "your son" } },
    { key: "abuela", re: /\b(abuela|abuelita|grandma|grandmother)\b/, label: { es: "Abuela", en: "Grandma" }, poss: { es: "tu abuela", en: "your grandma" } },
    { key: "abuelo", re: /\b(abuelo|abuelito|grandpa|grandfather)\b/, label: { es: "Abuelo", en: "Grandpa" }, poss: { es: "tu abuelo", en: "your grandpa" } },
    { key: "tia", re: /\b(tia|aunt)\b/, label: { es: "Tía", en: "Aunt" }, poss: { es: "tu tía", en: "your aunt" } },
    { key: "tio", re: /\b(tio|uncle)\b/, label: { es: "Tío", en: "Uncle" }, poss: { es: "tu tío", en: "your uncle" } },
  ];
  const REL = Object.fromEntries(RELATIONS.map((r) => [r.key, r]));

  // ───────────────────────── Estado inicial ─────────────────────────
  function seedState(scenario, name) {
    const userName = (name || "Juan").trim() || "Juan";
    const base = { scenario, pending: null, transfers: {}, seq: 1, onb: null, flags: {} };
    if (scenario === "new") {
      return Object.assign(base, {
        user: { name: userName },
        account: { open: false, balance: 0, card: null },
        credit: { limit: 150, used: 0 },
        loan: null,
        recipients: [],
        payday: null,
        movements: [],
        onb: { step: "recipient" },
      });
    }
    return Object.assign(base, {
      user: { name: userName },
      account: { open: true, balance: 1240.35, card: { last4: "4821", frozen: false } },
      credit: { limit: 500, used: 0 },
      loan: { amount: 200, n: 4, paid: 2, installment: 50, due: { es: "jueves 30 de octubre", en: "Thursday, October 30" } },
      recipients: [
        { id: "mama", rel: "mama", name: "Rosa Hernández", short: { es: "Mamá", en: "Mom" }, city: "Guadalajara", country: "MX", method: "BBVA ••4410" },
        { id: "papa", rel: "papa", name: "José Hernández", short: { es: "Papá", en: "Dad" }, city: "Morelia", country: "MX", method: "Banorte ••2231" },
        { id: "ana", rel: "hermana", name: "Ana Hernández", short: { es: "Ana", en: "Ana" }, city: "Ciudad de México", country: "MX", method: "Nu ••7781" },
        { id: "carlos", rel: "tio", name: "Carlos Pérez", short: { es: "Tío Carlos", en: "Uncle Carlos" }, city: "Quetzaltenango", country: "GT", method: { es: "Efectivo · Banrural", en: "Cash pickup · Banrural" } },
      ],
      payday: { es: "Cada viernes", en: "Every Friday" },
      bills: [
        { id: "luz_mama", kind: "luz", provider: "CFE", rid: "mama", label: { es: "Luz de Mamá", en: "Mom's electricity" }, amount: 50, due: { es: "8 de noviembre", en: "November 8" }, paid: false },
        { id: "agua_mama", kind: "agua", provider: "SIAPA", rid: "mama", label: { es: "Agua de Mamá", en: "Mom's water" }, amount: 18.5, due: { es: "15 de noviembre", en: "November 15" }, paid: false },
        { id: "internet_papa", kind: "internet", provider: "Telmex", rid: "papa", label: { es: "Internet de Papá", en: "Dad's internet" }, amount: 25, due: { es: "20 de noviembre", en: "November 20" }, paid: false },
      ],
      phones: { mama: { carrier: "Telcel", num: "••• 4412" }, papa: { carrier: "Telcel", num: "••• 9031" }, ana: { carrier: "AT&T México", num: "••• 7781" }, carlos: { carrier: "Tigo", num: "••• 2207" } },
      movements: [
        { id: "m1", kind: "in", title: { es: "Depósito de nómina", en: "Payroll deposit" }, date: { es: "24 oct", en: "Oct 24" }, amount: 480 },
        { id: "m2", kind: "out", title: { es: "Envío a Ana", en: "Transfer to Ana" }, date: { es: "20 oct", en: "Oct 20" }, amount: -152.99 },
        { id: "m3", kind: "out", title: { es: "Tarjeta · Walmart", en: "Card · Walmart" }, date: { es: "18 oct", en: "Oct 18" }, amount: -64.12 },
        { id: "m4", kind: "out", title: { es: "Envío a Mamá", en: "Transfer to Mom" }, date: { es: "17 oct", en: "Oct 17" }, amount: -102.99 },
      ],
    });
  }

  // ───────────────────────── Utilidades ─────────────────────────
  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[¿?¡!.,;:"]/g, " ").replace(/\s+/g, " ").trim();
  const r2 = (n) => Math.round(n * 100) / 100;
  function money(n, lang) {
    const v = Math.abs(n).toLocaleString(lang === "en" ? "en-US" : "es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (n < 0 ? "−" : "") + "$" + v;
  }
  function moneyShort(n, lang) {
    const whole = Math.abs(n % 1) < 0.005;
    const v = Math.abs(n).toLocaleString(lang === "en" ? "en-US" : "es-MX", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 });
    return (n < 0 ? "−" : "") + "$" + v;
  }
  function local(n, country, lang) {
    const c = CONFIG.rates[country];
    const dec = c.rate > 100 ? 0 : 2;
    return c.sym + n.toLocaleString(lang === "en" ? "en-US" : "es-MX", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + " " + c.cur;
  }
  // Para voz: "1,878 pesos"
  function localSpoken(n, country, lang) {
    const c = CONFIG.rates[country];
    return Math.round(n).toLocaleString(lang === "en" ? "en-US" : "es-MX") + " " + c.unit[lang];
  }
  function usdSpoken(n, lang) {
    const whole = Math.abs(n % 1) < 0.005;
    const v = n.toLocaleString(lang === "en" ? "en-US" : "es-MX", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 });
    return lang === "en" ? `$${v}` : `${v} dólares`;
  }
  const L = (lang, es, en) => (lang === "en" ? en : es);
  const tr = (v, lang) => (v && typeof v === "object" ? v[lang] || v.es : v);
  function addDays(d, days) { const x = new Date(d); x.setDate(x.getDate() + days); return x; }
  function dateLabel(d, lang) { return d.toLocaleDateString(lang === "en" ? "en-US" : "es-MX", { day: "numeric", month: "short" }); }
  const TODAY = () => new Date(2026, 9, 27); // fecha fija del prototipo

  // ───────────────────────── Números en palabras (ES/EN) ─────────────────────────
  const NUMW = {
    dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
    once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19,
    veinte: 20, veinticinco: 25, treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90,
    cien: 100, ciento: 100, doscientos: 200, trescientos: 300, cuatrocientos: 400, quinientos: 500, seiscientos: 600,
    setecientos: 700, ochocientos: 800, novecientos: 900,
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, fifteen: 15,
    twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  };
  function wordsToNumber(t) {
    // Devuelve el primer número escrito con palabras, o null
    const toks = t.split(" ");
    let total = 0, cur = 0, found = false;
    for (let i = 0; i < toks.length; i++) {
      const w = toks[i];
      if (w === "y" || w === "and") continue;
      if (w in NUMW) { cur += NUMW[w]; found = true; continue; }
      if (w === "hundred") { cur = (cur || 1) * 100; found = true; continue; }
      if ((w === "mil" || w === "thousand") ) { cur = (cur || 1) * 1000; total += cur; cur = 0; found = true; continue; }
      if (found) break;
    }
    if (!found) return null;
    return total + cur;
  }
  function parseAmount(text) {
    // Devuelve {value, currency:'USD'|'LOCAL'} o null
    const t = norm(text).replace(/(\d),(\d{3})/g, "$1$2");
    const isLocal = /\b(pesos|mxn|quetzales|lempiras|cop)\b/.test(t) && !/\bdolar/.test(t);
    const m = t.match(/\$?\s?(\d+(?:\.\d{1,2})?)\s*(k)?/);
    let v = null;
    if (m) { v = parseFloat(m[1]) * (m[2] ? 1000 : 1); }
    else v = wordsToNumber(t);
    if (v == null || isNaN(v) || v <= 0) return null;
    return { value: v, currency: isLocal ? "LOCAL" : "USD" };
  }

  function findRelation(t) { for (const r of RELATIONS) if (r.re.test(t)) return r; return null; }
  function findCity(t) {
    for (const [k, c, label] of CITIES) if (new RegExp("\\b" + k + "\\b").test(t)) return { key: k, country: c, label };
    return null;
  }
  function resolveRecipient(state, query) {
    if (!query) return null;
    const t = norm(query);
    for (const r of state.recipients) {
      const first = norm(r.name.split(" ")[0]);
      if (new RegExp("\\b" + first + "\\b").test(t) || t === r.id || norm(tr(r.short, "es")) === t || norm(tr(r.short, "en")) === t) return r;
    }
    const rel = findRelation(t);
    if (rel) return state.recipients.find((r) => r.rel === rel.key) || null;
    return null;
  }

  // ───────────────────────── Tools ─────────────────────────
  // hooks: { card(type,data)->id, update(id,patch), later(ms,fn), notify(textByLang), lang() }
  function makeTools(state, hooks) {
    const lang = () => hooks.lang();
    const nextId = (p) => p + state.seq++;

    function payLaterPlan(amount) {
      const pl = CONFIG.payLater;
      const total = r2(amount + CONFIG.fee + pl.fee);
      const each = r2(total / pl.payments);
      const dates = Array.from({ length: pl.payments }, (_, i) => addDays(TODAY(), pl.everyDays * (i + 1)));
      return { total, each, payments: pl.payments, dates, fee: CONFIG.fee, plFee: pl.fee };
    }
    function loanPlan(amount, months) {
      const m = months || CONFIG.loan.defaultMonths;
      const cost = r2(amount * CONFIG.loan.monthlyRate * m);
      const total = r2(amount + cost);
      const payments = m * 2;
      const each = r2(total / payments);
      return { amount, months: m, cost, total, payments, each, first: addDays(TODAY(), 14) };
    }
    const creditAvailable = () => r2(state.credit.limit - state.credit.used);

    const tools = {
      show_balance() {
        hooks.card("balance", {});
        return { balance: state.account.balance, card_last4: state.account.card && state.account.card.last4, card_frozen: !!(state.account.card && state.account.card.frozen), credit_available: creditAvailable(), apy: CONFIG.apy, account_open: state.account.open };
      },
      show_rates({ country } = {}) {
        hooks.card("rates", { country: country || null });
        return Object.fromEntries(Object.entries(CONFIG.rates).map(([k, v]) => [k, `${v.rate} ${v.cur} per USD`]));
      },
      show_card() {
        if (!state.account.card) return { status: "no_card" };
        hooks.card("card", {});
        return { last4: state.account.card.last4, frozen: state.account.card.frozen };
      },
      set_card_frozen({ frozen }) {
        if (!state.account.card) return { status: "no_card" };
        state.account.card.frozen = !!frozen;
        hooks.card("card", { changed: true });
        return { status: "ok", frozen: state.account.card.frozen, last4: state.account.card.last4 };
      },
      show_movements() {
        hooks.card("movements", {});
        return { movements: state.movements.slice(0, 5).map((m) => ({ title: tr(m.title, "en"), amount: m.amount, date: tr(m.date, "en") })) };
      },
      list_recipients() {
        return { recipients: state.recipients.map((r) => ({ id: r.id, name: r.name, relation: r.rel, country: r.country, city: r.city })) };
      },
      prepare_transfer({ recipient, amount_usd, amount_local } = {}) {
        if (!state.account.open) return { status: "no_account" };
        if (!recipient) return { status: "need_recipient", options: state.recipients.map((r) => tr(r.short, lang())) };
        const r = resolveRecipient(state, recipient);
        if (!r) return { status: "unknown_recipient", name: recipient, options: state.recipients.map((x) => tr(x.short, lang())) };
        const rate = CONFIG.rates[r.country].rate;
        let amount = amount_usd ? Number(amount_usd) : amount_local ? r2(Number(amount_local) / rate) : null;
        if (!amount) return { status: "need_amount", recipient_id: r.id };
        amount = r2(amount);
        const receive = r2(amount * rate);
        const total = r2(amount + CONFIG.fee);
        if (total <= state.account.balance) {
          const cardId = hooks.card("send", { rid: r.id, amount, receive, total, fee: CONFIG.fee, source: "balance" });
          state.pending = { type: "send", rid: r.id, amount, receive, total, cardId };
          return { status: "ready", recipient_id: r.id, recipient_name: r.name, amount_usd: amount, fee_usd: CONFIG.fee, total_usd: total, receives_local: receive, currency: CONFIG.rates[r.country].cur, needs_confirmation: true };
        }
        return tools.offer_pay_later({ recipient: r.id, amount_usd: amount, _short: true });
      },
      offer_pay_later({ recipient, amount_usd, _short } = {}) {
        const r = resolveRecipient(state, recipient);
        if (!r) return { status: "need_recipient" };
        const amount = r2(Number(amount_usd));
        if (!amount) return { status: "need_amount", recipient_id: r.id };
        const plan = payLaterPlan(amount);
        if (plan.total > creditAvailable()) return { status: "over_limit", credit_available: creditAvailable(), balance: state.account.balance };
        const receive = r2(amount * CONFIG.rates[r.country].rate);
        const cardId = hooks.card("paylater", { rid: r.id, amount, receive, plan, shortfall: _short ? r2(amount + CONFIG.fee - state.account.balance) : 0 });
        state.pending = { type: "paylater", rid: r.id, amount, receive, plan, cardId };
        return { status: _short ? "insufficient_offer_pay_later" : "ready_pay_later", alternative: _short ? "or add money with prepare_deposit" : undefined, balance: state.account.balance, recipient_id: r.id, amount_usd: amount, receives_local: receive, currency: CONFIG.rates[r.country].cur, payments: plan.payments, each_usd: plan.each, each: plan.each, total_to_repay_usd: plan.total, needs_confirmation: true };
      },
      offer_loan({ amount_usd, months } = {}) {
        const avail = creditAvailable();
        if (!amount_usd) return { status: "need_amount", max: avail, min: CONFIG.loan.min };
        const amount = r2(Number(amount_usd));
        if (amount < CONFIG.loan.min) return { status: "below_min", min: CONFIG.loan.min };
        const plan = loanPlan(amount, months);
        if (plan.total > avail) return { status: "over_limit", max: r2(avail / (1 + CONFIG.loan.monthlyRate * plan.months)) };
        const cardId = hooks.card("loan_offer", { plan });
        state.pending = { type: "loan", plan, cardId };
        return { status: "ready", amount, months: plan.months, payments: plan.payments, each: plan.each, cost: plan.cost, total: plan.total, needs_confirmation: true };
      },
      prepare_installment_payment() {
        if (!state.loan || state.loan.paid >= state.loan.n) return { status: "nothing_due" };
        const cardId = hooks.card("installment", {});
        state.pending = { type: "installment", amount: state.loan.installment, cardId };
        return { status: "ready", amount: state.loan.installment, number: state.loan.paid + 1, of: state.loan.n, needs_confirmation: true };
      },
      save_recipient({ relation, name, city } = {}) {
        const rel = REL[relation] || findRelation(norm(relation || ""));
        const c = city ? findCity(norm(city)) : null;
        const id = rel ? rel.key : norm(name || "familiar").replace(/\s/g, "");
        const rec = {
          id, rel: rel ? rel.key : null, name: name || (rel ? rel.label.es : "Familiar"),
          short: rel ? rel.label : { es: name, en: name }, city: c ? c.label : city || "", country: c ? c.country : "MX",
          method: { es: "Cuenta bancaria o efectivo", en: "Bank account or cash pickup" }, isNew: true,
        };
        state.recipients = state.recipients.filter((x) => x.id !== id).concat(rec);
        hooks.card("recipient_saved", { rid: id });
        return { status: "ok", recipient_id: id, country: rec.country };
      },
      save_payday({ payday } = {}) {
        state.payday = payday || { es: "Sin definir", en: "Not set" };
        hooks.card("payday", {});
        return { status: "ok" };
      },
      prepare_open_account() {
        if (state.account.open) return { status: "already_open" };
        const cardId = hooks.card("open_account", {});
        state.pending = { type: "open", cardId };
        return { status: "ready", needs_confirmation: true };
      },
      talk_to_human({ channel } = {}) {
        const ch = /whats/i.test(channel || "") ? "whatsapp" : /app|aqui|here|chat/i.test(channel || "") ? "app" : null;
        if (!ch) return { status: "need_channel", options: ["app", "whatsapp"] };
        hooks.card("human", { channel: ch });
        state.flags.human = ch;
        return ch === "app" ? { status: "connecting", channel: "app", agent: "Lucía", wait_minutes: 2 } : { status: "opening_whatsapp", channel: "whatsapp" };
      },
      // ── Calculadora: cotiza sin mover dinero ──
      show_quote({ recipient, amount_usd, amount_local, country } = {}) {
        const r = recipient ? resolveRecipient(state, recipient) : null;
        const cc = (r && r.country) || (country && CONFIG.rates[String(country).toUpperCase()] ? String(country).toUpperCase() : "MX");
        const rate = CONFIG.rates[cc].rate;
        let amount = amount_usd ? Number(amount_usd) : amount_local ? r2(Number(amount_local) / rate) : null;
        if (!amount) return { status: "need_amount" };
        amount = r2(amount);
        const receive = r2(amount * rate), total = r2(amount + CONFIG.fee);
        hooks.card("quote", { rid: r ? r.id : null, country: cc, amount, receive, total, fee: CONFIG.fee });
        state.lastQuote = { rid: r ? r.id : null, amount };
        return { status: "ok", country: cc, amount_usd: amount, fee_usd: CONFIG.fee, total_usd: total, receives_local: receive, currency: CONFIG.rates[cc].cur, rate, recipient_id: r ? r.id : null, can_afford: total <= state.account.balance };
      },
      // ── Cargar dinero a la billetera Félix ──
      prepare_deposit({ amount_usd, source } = {}) {
        const amount = r2(Number(amount_usd || 0));
        if (!amount) return { status: "need_amount", min: 10, max: 2500 };
        if (amount < 10 || amount > 2500) return { status: "out_of_range", min: 10, max: 2500 };
        const src = /bank|banco|cuenta/i.test(source || "") ? "bank" : "debit";
        const cardId = hooks.card("deposit", { amount, source: src });
        state.pending = { type: "deposit", amount, source: src, cardId };
        return { status: "ready", amount_usd: amount, source: src === "bank" ? "Chase checking ••0917" : "Chase debit ••5521", fee: 0, arrives: src === "bank" ? "1-3 business days" : "instant", new_balance: r2(state.account.balance + amount), needs_confirmation: true };
      },
      // ── Pago de servicios (luz, agua, internet) ──
      show_bills() {
        hooks.card("bills", {});
        return { bills: (state.bills || []).map((b) => ({ id: b.id, name: b.label.en, provider: b.provider, amount_usd: b.amount, due: b.due.en, paid: b.paid })) };
      },
      prepare_bill_payment({ bill } = {}) {
        const list = state.bills || [];
        const q = norm(bill || "");
        const b = list.find((x) => !x.paid && (x.id === q || q.includes(x.kind) || q.includes(norm(x.provider)) || (q && norm(x.label.es).includes(q))))
          || (q ? null : list.find((x) => !x.paid));
        if (!b) return { status: "not_found", options: list.filter((x) => !x.paid).map((x) => x.label.en) };
        if (b.amount > state.account.balance) return { status: "insufficient", balance: state.account.balance };
        const cardId = hooks.card("bill_pay", { bid: b.id });
        state.pending = { type: "bill", bid: b.id, amount: b.amount, cardId };
        return { status: "ready", bill: b.label.en, provider: b.provider, amount_usd: b.amount, due: b.due.en, needs_confirmation: true };
      },
      // ── Recargas de celular ──
      prepare_topup({ recipient, amount_usd } = {}) {
        const r = resolveRecipient(state, recipient || "");
        if (!r) return { status: "need_recipient", options: state.recipients.map((x) => tr(x.short, lang())) };
        const amount = r2(Number(amount_usd || 0));
        if (!amount) return { status: "need_amount", options_usd: [5, 10, 15, 20] };
        const ph = (state.phones || {})[r.id] || { carrier: "Telcel", num: "••• 0000" };
        const cardId = hooks.card("topup", { rid: r.id, amount, carrier: ph.carrier, num: ph.num });
        state.pending = { type: "topup", rid: r.id, amount, carrier: ph.carrier, cardId };
        return { status: "ready", recipient_id: r.id, carrier: ph.carrier, amount_usd: amount, receives_local: r2(amount * CONFIG.rates[r.country].rate), needs_confirmation: true };
      },
      show_profile() {
        hooks.card("profile", {});
        return { name: state.user.name, phone: "+1 (713) 555-0142", member_since: "March 2025", card_last4: state.account.card && state.account.card.last4, recipients: state.recipients.length };
      },
      show_product({ product } = {}) {
        const p = /credit|cr[eé]dito|prest/i.test(product || "") ? "credit" : /card|tarjeta/i.test(product || "") ? "card" : /later|despu/i.test(product || "") ? "paylater" : "wallet";
        hooks.card("product", { product: p });
        const info = {
          wallet: "Félix account: free, earns 4% APY, add money from any debit card instantly.",
          card: "Félix Visa debit card: pay anywhere, freeze it any time, no monthly fee.",
          paylater: "Send now, pay later: send today and pay in 4 payments every two weeks, no interest, $4.99 fixed fee.",
          credit: `Félix credit line: up to $${state.credit.limit}, small loans paid every two weeks.`,
        };
        return { product: p, summary: info[p] };
      },
      cancel_pending() {
        const p = state.pending;
        if (!p) return { status: "nothing_pending" };
        hooks.update(p.cardId, { resolved: "cancelled" });
        state.pending = null;
        return { status: "cancelled", type: p.type };
      },
      confirm_pending() {
        const p = state.pending;
        if (!p) return { status: "nothing_pending" };
        state.pending = null;
        hooks.update(p.cardId, { resolved: "done" });
        const lg = lang();
        if (p.type === "send" || p.type === "paylater") {
          const r = state.recipients.find((x) => x.id === p.rid);
          if (p.type === "send") state.account.balance = r2(state.account.balance - p.total);
          else state.credit.used = r2(state.credit.used + p.plan.total);
          const tid = nextId("t");
          state.transfers[tid] = { id: tid, rid: p.rid, amount: p.amount, receive: p.receive, step: 0, via: p.type, ref: "FX" + (480210 + state.seq) };
          state.movements.unshift({ id: tid, kind: "out", title: { es: `Envío a ${tr(r.short, "es")}`, en: `Transfer to ${tr(r.short, "en")}` }, date: { es: "Hoy", en: "Today" }, amount: -(p.type === "send" ? p.total : r2(p.amount + CONFIG.fee)), note: p.type === "paylater" ? { es: "Paga después", en: "Pay later" } : null });
          state.flags.sent = (state.flags.sent || 0) + 1;
          if (p.type === "paylater") state.flags.paylater = true;
          const cid = hooks.card("tracking", { tid });
          hooks.later(CONFIG.delivery.onTheWayMs, () => { state.transfers[tid].step = 1; hooks.update(cid, {}); });
          hooks.later(CONFIG.delivery.deliveredMs, () => {
            state.transfers[tid].step = 2; hooks.update(cid, {});
            state.flags.delivered = true;
            const c = CONFIG.rates[r.country];
            hooks.notify({
              es: `Ya llegó. ${cap(REL[r.rel] ? REL[r.rel].poss.es : r.name)} recibió ${localSpoken(p.receive, r.country, "es")}.`,
              en: `It arrived. ${cap(REL[r.rel] ? REL[r.rel].poss.en : r.name)} got ${localSpoken(p.receive, r.country, "en")}.`,
            });
          });
          return { status: "sent", transfer_id: tid, recipient_id: p.rid, arrives_in: "minutes", balance: state.account.balance, via: p.type };
        }
        if (p.type === "loan") {
          state.account.balance = r2(state.account.balance + p.plan.amount);
          state.credit.used = r2(state.credit.used + p.plan.total);
          state.movements.unshift({ id: nextId("m"), kind: "in", title: { es: "Crédito Félix", en: "Félix loan" }, date: { es: "Hoy", en: "Today" }, amount: p.plan.amount });
          state.flags.loan = true;
          hooks.card("loan_done", { plan: p.plan });
          return { status: "disbursed", amount: p.plan.amount, balance: state.account.balance, first_payment: dateLabel(p.plan.first, lg) };
        }
        if (p.type === "installment") {
          state.account.balance = r2(state.account.balance - p.amount);
          state.loan.paid += 1;
          state.movements.unshift({ id: nextId("m"), kind: "out", title: { es: `Pago de préstamo ${state.loan.paid}/${state.loan.n}`, en: `Loan payment ${state.loan.paid}/${state.loan.n}` }, date: { es: "Hoy", en: "Today" }, amount: -p.amount });
          const done = state.loan.paid >= state.loan.n;
          hooks.card(done ? "loan_paid_off" : "installment_paid", {});
          return { status: done ? "paid_off" : "paid", paid: state.loan.paid, of: state.loan.n, balance: state.account.balance };
        }
        if (p.type === "bill") {
          const b = state.bills.find((x) => x.id === p.bid);
          state.account.balance = r2(state.account.balance - p.amount); b.paid = true;
          state.movements.unshift({ id: nextId("m"), kind: "out", title: { es: `${b.provider} · ${b.label.es}`, en: `${b.provider} · ${b.label.en}` }, date: { es: "Hoy", en: "Today" }, amount: -p.amount });
          state.flags.bill = true;
          hooks.card("bill_paid", { bid: b.id });
          return { status: "paid", bill: b.label.en, balance: state.account.balance };
        }
        if (p.type === "topup") {
          const r = state.recipients.find((x) => x.id === p.rid);
          state.account.balance = r2(state.account.balance - p.amount);
          state.movements.unshift({ id: nextId("m"), kind: "out", title: { es: `Recarga ${p.carrier} · ${tr(r.short, "es")}`, en: `${p.carrier} top-up · ${tr(r.short, "en")}` }, date: { es: "Hoy", en: "Today" }, amount: -p.amount });
          state.flags.topup = true;
          hooks.card("topup_done", { rid: p.rid, amount: p.amount, carrier: p.carrier });
          return { status: "topped_up", recipient_id: p.rid, balance: state.account.balance };
        }
        if (p.type === "deposit") {
          state.account.balance = r2(state.account.balance + p.amount);
          state.movements.unshift({ id: nextId("m"), kind: "in", title: { es: "Carga a tu cuenta", en: "Money added" }, date: { es: "Hoy", en: "Today" }, amount: p.amount });
          state.flags.deposit = true;
          hooks.card("deposit_done", { amount: p.amount });
          return { status: "deposited", amount: p.amount, balance: state.account.balance };
        }
        if (p.type === "open") {
          state.account.open = true;
          state.account.card = { last4: "3307", frozen: false };
          state.flags.opened = true;
          hooks.card("account_opened", {});
          return { status: "opened", card_last4: "3307", balance: 0, pay_later_limit: creditAvailable() };
        }
        return { status: "unknown" };
      },
    };
    return tools;
  }
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  // ───────────────────────── Cerebro demo (reglas) ─────────────────────────
  const RX = {
    yes: /^(si|sip|simon|claro|dale|va|sale|ok|okay|okey|confirmo|confirmar|confirma|hazlo|adelante|de acuerdo|perfecto|listo|correcto|asi es|yes|yeah|yep|sure|confirm|do it|go ahead|please do|envialo|mandalo|pagalo|abrela|acepto)\b/,
    no: /^(no|nel|nop|nope|mejor no|cancela|cancelar|cancel|olvidalo|dejalo|never ?mind|stop|wait|espera)\b|\b(cancela|cancelar|cancel)\b/,
    human: /\b(persona|humano|agente|asesor|alguien real|representante|human|person|representative|real agent|someone)\b/,
    help: /\b(que puedes hacer|que haces|ayuda|ayudame|help|what can you do|opciones)\b/,
    rates: /\b(tipo de cambio|a como esta|como esta el dolar|cuanto esta el dolar|precio del dolar|el dolar hoy|cambio|rate|rates|exchange|dollar at|dollar today|how much is the dollar)\b/,
    balance: /\b(saldo|cuanto tengo|cuanto dinero tengo|mi cuenta|balance|how much do i have|how much money)\b/,
    unfreeze: /\b(descongel\w*|desbloque\w*|activa\w* (mi |la )?tarjeta|unfreeze|unlock)\b/,
    freeze: /\b(congel\w*|bloque\w*|freeze|lock|perdi mi tarjeta|me robaron|lost my card|stolen)\b/,
    card: /\b(tarjeta|card)\b/,
    movements: /\b(movimientos|historial|actividad|transacciones|ultimos gastos|activity|transactions|history)\b/,
    installment: /\b((pag\w*|abon\w*|pay)\b.*\b(prestamo|cuota|loan|installment|credito|mensualidad|lo que debo))|\b(mi cuota|my installment|lo que debo|what i owe)\b/,
    payLater: /\b(paga\w* despues|pago despues|pay later|envia\w* hoy|send now|a credito|fiado)\b/,
    loan: /\b(prestamo|credito|prestame|presta|prestas|adelanto|necesito dinero|me falta dinero|loan|borrow|lend|advance)\b/,
    send: /\b(envia\w*|envie\w*|enviar|mand\w*|transfer\w*|send|wire|remesa|deposit\w* a|pasale|pasar)\b/,
    bill: /\b(luz|agua|internet|cfe|siapa|telmex|recibo|servicio\w*|bill\w*|electric\w*|water)\b/,
    topup: /\b(recarga\w*|tiempo aire|saldo (al|del|de su) cel\w*|top ?up|airtime)\b/,
    deposit: /\b(carga\w*|cargar|recarga\w* mi cuenta|meter dinero|mete\w* dinero|deposita\w* en mi|agrega\w* (dinero|saldo)|fondea\w*|add money|load money|deposit)\b/,
    quote: /\b(cuanto (le )?(llega|recibe)|cuanto llegaria|calcula\w*|cotiza\w*|how much (would|does|will) (she|he|they|it) (get|receive)|quote)\b|\by si (mando|envio)\b/,
    profile: /\b(mi perfil|mis datos|perfil|profile|my info)\b/,
    product: /\b(que es|como funciona|cuentame (de|sobre)|tell me about|what is|how does)\b/,
    whatsapp: /\bwhats\s?app\b/,
    inApp: /\b(aqui|por aqui|en la app|app|chat|here|in the app)\b/,
    greet: /^(hola|buenas|buenos dias|buenas tardes|hey|hi|hello|que onda)\b/,
    thanks: /\b(gracias|thank|thanks)\b/,
  };

  function parsePayday(t, lang) {
    const days = { lunes: ["lunes", "Monday"], martes: ["martes", "Tuesday"], miercoles: ["miércoles", "Wednesday"], jueves: ["jueves", "Thursday"], viernes: ["viernes", "Friday"], sabado: ["sábado", "Saturday"], domingo: ["domingo", "Sunday"], monday: ["lunes", "Monday"], tuesday: ["martes", "Tuesday"], wednesday: ["miércoles", "Wednesday"], thursday: ["jueves", "Thursday"], friday: ["viernes", "Friday"], saturday: ["sábado", "Saturday"], sunday: ["domingo", "Sunday"] };
    if (/\b(quince|quincena|quincenal|dos semanas|15 y 30|15 y ultimo|biweekly|every two weeks|every other)\b/.test(t)) return { es: "Cada quince días", en: "Every two weeks" };
    if (/\b(mes|mensual|monthly|month)\b/.test(t)) return { es: "Una vez al mes", en: "Once a month" };
    for (const k in days) if (new RegExp("\\b" + k + "\\b").test(t)) return { es: "Cada " + days[k][0], en: "Every " + days[k][1] };
    if (/\b(semana|semanal|weekly|week)\b/.test(t)) return { es: "Cada semana", en: "Every week" };
    if (/\b(diario|cada dia|daily|every day)\b/.test(t)) return { es: "Diario", en: "Daily" };
    return null;
  }

  function makeBrain(state, tools, getLang) {
    const ctx = { awaiting: null, draft: {} };
    const lg = () => getLang();
    const S = (es, en) => L(lg(), es, en);
    const N = () => state.user.name;
    const recName = (rid) => { const r = state.recipients.find((x) => x.id === rid); if (!r) return ""; return REL[r.rel] ? REL[r.rel].poss[lg()] : r.name; };
    const recShort = (rid) => { const r = state.recipients.find((x) => x.id === rid); return r ? tr(r.short, lg()) : ""; };
    const listNames = () => { const n = state.recipients.map((r) => tr(r.short, lg())); return n.length <= 1 ? n.join("") : n.slice(0, -1).join(", ") + S(" o ", " or ") + n[n.length - 1]; };

    function greet() {
      if (state.scenario === "new" && !state.account.open) {
        ctx.awaiting = "onb_recipient";
        return S(`Hola ${N()}, soy Félix. Te ayudo a mandarle dinero a tu familia. Para empezar, ¿a quién le envías dinero y en qué ciudad vive?`,
          `Hi ${N()}, I'm Félix. I help you send money to your family. To start, who do you send money to, and what city do they live in?`);
      }
      ctx.awaiting = null;
      const b = (state.bills || []).find((x) => !x.paid);
      return S(`Hola ${N()}. Tienes ${money(state.account.balance, "es")} en tu cuenta.${b ? ` ${b.label.es} vence el ${b.due.es}. ¿La pagamos?` : " ¿Qué necesitas hoy?"}`,
        `Hi ${N()}. You have ${money(state.account.balance, "en")} in your account.${b ? ` ${b.label.en} is due ${b.due.en}. Should we pay it?` : " What do you need today?"}`);
    }

    // ── Envío ──
    function trySend() {
      const d = ctx.draft;
      const res = tools.prepare_transfer({ recipient: d.rid, amount_usd: d.currency === "USD" ? d.amount : null, amount_local: d.currency === "LOCAL" ? d.amount : null });
      switch (res.status) {
        case "no_account":
          ctx.awaiting = null; return S("Primero abrimos tu cuenta. Toma un minuto.", "First let's open your account. It takes a minute.");
        case "need_recipient":
          ctx.awaiting = "send_recipient"; return S(`¿A quién se lo envío? Tienes a ${listNames()}.`, `Who should I send it to? You have ${listNames()}.`);
        case "unknown_recipient":
          ctx.awaiting = "send_recipient"; return S(`No tengo a esa persona guardada. Tienes a ${listNames()}. ¿A quién le envío?`, `I don't have that person saved. You have ${listNames()}. Who should I send to?`);
        case "need_amount":
          ctx.awaiting = "send_amount"; return S(`¿Cuánto le envío a ${recName(res.recipient_id)}?`, `How much should I send ${recName(res.recipient_id)}?`);
        case "ready": {
          ctx.awaiting = "confirm"; const r = state.recipients.find((x) => x.id === res.recipient_id);
          return S(`Le envías ${usdSpoken(res.amount_usd, "es")} a ${recName(r.id)}. Recibe ${localSpoken(res.receives_local, r.country, "es")}. Con la comisión son ${usdSpoken(res.total_usd, "es")} de tu saldo. ¿Lo envío?`,
            `You're sending ${usdSpoken(res.amount_usd, "en")} to ${recName(r.id)}. They get ${localSpoken(res.receives_local, r.country, "en")}. With the fee it's ${usdSpoken(res.total_usd, "en")} from your balance. Should I send it?`);
        }
        case "insufficient_offer_pay_later": {
          ctx.awaiting = "confirm"; const r = state.recipients.find((x) => x.id === res.recipient_id);
          return S(`Tu saldo es de ${usdSpoken(res.balance, "es")} y no alcanza. Puedo enviarlo hoy y lo pagas después, en ${res.payments} pagos de ${usdSpoken(res.each, "es")} cada quince días. ${cap(recName(r.id))} recibe ${localSpoken(res.receives_local, r.country, "es")} hoy. ¿Lo envío así?`,
            `Your balance is ${usdSpoken(res.balance, "en")}, so it's not enough. I can send it today and you pay later, in ${res.payments} payments of ${usdSpoken(res.each, "en")} every two weeks. ${cap(recName(r.id))} gets ${localSpoken(res.receives_local, r.country, "en")} today. Send it that way?`);
        }
        case "over_limit":
          ctx.awaiting = null; return S(`Ese monto pasa tu límite. Tienes ${usdSpoken(res.balance, "es")} de saldo y ${usdSpoken(res.credit_available, "es")} disponibles para pagar después. Dime un monto menor.`,
            `That's over your limit. You have ${usdSpoken(res.balance, "en")} in your balance and ${usdSpoken(res.credit_available, "en")} available to pay later. Tell me a smaller amount.`);
      }
      return S("Algo no salió bien con el envío. Probemos otra vez.", "Something went wrong with the transfer. Let's try again.");
    }
    function payLaterNow() {
      const d = ctx.draft;
      if (!d.rid) { ctx.mode = "paylater"; ctx.awaiting = "send_recipient"; return S(`Claro. ¿A quién le envías? Tienes a ${listNames()}.`, `Sure. Who are you sending to? You have ${listNames()}.`); }
      if (!d.amount) { ctx.mode = "paylater"; ctx.awaiting = "send_amount"; return S(`¿Cuánto le envías a ${recName(d.rid)}?`, `How much are you sending ${recName(d.rid)}?`); }
      const r = state.recipients.find((x) => x.id === d.rid);
      const amt = d.currency === "LOCAL" ? d.amount / CONFIG.rates[r.country].rate : d.amount;
      const res = tools.offer_pay_later({ recipient: d.rid, amount_usd: amt });
      if (res.status === "over_limit") { ctx.awaiting = null; return S(`Para pagar después tienes hasta ${usdSpoken(res.credit_available, "es")}. Dime un monto menor.`, `You have up to ${usdSpoken(res.credit_available, "en")} to pay later. Tell me a smaller amount.`); }
      ctx.awaiting = "confirm";
      return S(`Lo envías hoy y pagas ${res.payments} pagos de ${usdSpoken(res.each, "es")} cada quince días. ${cap(recName(d.rid))} recibe ${localSpoken(res.receives_local, r.country, "es")}. ¿Lo envío?`,
        `You send it today and pay ${res.payments} payments of ${usdSpoken(res.each, "en")} every two weeks. ${cap(recName(d.rid))} gets ${localSpoken(res.receives_local, r.country, "en")}. Send it?`);
    }

    // ── Crédito ──
    function tryLoan(amount) {
      const res = tools.offer_loan({ amount_usd: amount });
      if (res.status === "need_amount") { ctx.awaiting = "loan_amount"; return S(`Te puedo prestar desde ${usdSpoken(res.min, "es")} hasta ${usdSpoken(Math.floor(res.max / (1 + CONFIG.loan.monthlyRate * CONFIG.loan.defaultMonths)), "es")}. ¿Cuánto necesitas?`, `I can lend you from ${usdSpoken(res.min, "en")} up to ${usdSpoken(Math.floor(res.max / (1 + CONFIG.loan.monthlyRate * CONFIG.loan.defaultMonths)), "en")}. How much do you need?`); }
      if (res.status === "below_min") { ctx.awaiting = "loan_amount"; return S(`El mínimo es ${usdSpoken(res.min, "es")}. ¿Cuánto necesitas?`, `The minimum is ${usdSpoken(res.min, "en")}. How much do you need?`); }
      if (res.status === "over_limit") { ctx.awaiting = "loan_amount"; return S(`Hoy te puedo prestar hasta ${usdSpoken(Math.floor(res.max), "es")}. ¿Te sirve un monto menor?`, `Today I can lend you up to ${usdSpoken(Math.floor(res.max), "en")}. Does a smaller amount work?`); }
      ctx.awaiting = "confirm";
      return S(`Te presto ${usdSpoken(res.amount, "es")} hoy. Pagas ${res.payments} pagos de ${usdSpoken(res.each, "es")} cada quince días. En total pagas ${usdSpoken(res.total, "es")}. ¿Lo acepto?`,
        `I'll lend you ${usdSpoken(res.amount, "en")} today. You pay ${res.payments} payments of ${usdSpoken(res.each, "en")} every two weeks. ${usdSpoken(res.total, "en")} in total. Should I accept it?`);
    }

    // ── Cargar billetera ──
    function tryDeposit(amount) {
      const res = tools.prepare_deposit({ amount_usd: amount });
      if (res.status === "out_of_range") { ctx.awaiting = "deposit_amount"; return S("Puedes cargar desde 10 hasta 2,500 dólares. ¿Cuánto cargo?", "You can add from $10 to $2,500. How much?"); }
      ctx.awaiting = "confirm";
      return S(`Cargo ${usdSpoken(res.amount_usd, "es")} desde tu débito Chase. Llega al instante y sin comisión. ¿Lo cargo?`, `I'll add ${usdSpoken(res.amount_usd, "en")} from your Chase debit. Instant and free. Should I?`);
    }
    // ── Calculadora ──
    function tryQuote(a, r) {
      const res = tools.show_quote({ recipient: r ? r.id : null, amount_usd: a.currency === "USD" ? a.value : null, amount_local: a.currency === "LOCAL" ? a.value : null });
      ctx.awaiting = "after_quote";
      const who = r ? recName(r.id) : S("tu familiar", "your family");
      return S(`Si mandas ${usdSpoken(res.amount_usd, "es")}, ${who} recibe ${localSpoken(res.receives_local, res.country, "es")}. ¿Lo envío?`, `If you send ${usdSpoken(res.amount_usd, "en")}, ${who} gets ${localSpoken(res.receives_local, res.country, "en")}. Send it?`);
    }

    // ── Confirmar / cancelar ──
    function confirm() {
      const p = state.pending;
      const res = tools.confirm_pending();
      ctx.awaiting = null; ctx.draft = {}; ctx.mode = null;
      if (res.status === "nothing_pending") return S("No tengo nada pendiente. ¿Qué necesitas?", "Nothing is pending. What do you need?");
      if (res.status === "sent") {
        return S(`Listo, ya va en camino a ${recName(res.recipient_id)}. Te aviso cuando llegue.`, `Done, it's on its way to ${recName(res.recipient_id)}. I'll let you know when it arrives.`);
      }
      if (res.status === "paid" && res.bill) return S(`Listo, pagado. Te queda un saldo de ${usdSpoken(res.balance, "es")}.`, `Done, paid. Your balance is ${usdSpoken(res.balance, "en")}.`);
      if (res.status === "topped_up") return S(`Listo, ya tiene saldo ${recName(res.recipient_id)}.`, `Done, ${recName(res.recipient_id)} has airtime now.`);
      if (res.status === "deposited") return S(`Listo. Tu saldo ahora es de ${usdSpoken(res.balance, "es")}.`, `Done. Your balance is now ${usdSpoken(res.balance, "en")}.`);
      if (res.status === "disbursed") return S(`Listo. Ya tienes ${usdSpoken(res.amount, "es")} en tu cuenta. Tu primer pago es el ${res.first_payment}. ¿Quieres enviarlo a alguien?`, `Done. You have ${usdSpoken(res.amount, "en")} in your account. Your first payment is ${res.first_payment}. Want to send it to someone?`);
      if (res.status === "paid") return S(`Pagado. Llevas ${res.paid} de ${res.of}. Te queda un saldo de ${usdSpoken(res.balance, "es")}.`, `Paid. That's ${res.paid} of ${res.of}. Your balance is ${usdSpoken(res.balance, "en")}.`);
      if (res.status === "paid_off") return S("¡Terminaste de pagar tu préstamo! Tu línea de crédito sube para la próxima.", "You paid off your loan! Your credit line goes up for next time.");
      if (res.status === "opened") {
        state.onb = null;
        const r = state.recipients[0];
        ctx.awaiting = "onb_first_send";
        ctx.draft = { rid: r ? r.id : null };
        return S(`Tu cuenta está abierta. Tu tarjeta de débito termina en ${res.card_last4}. Tu saldo está en cero, pero puedes enviar hoy y pagar después, hasta ${usdSpoken(res.pay_later_limit, "es")}. ¿Le envío algo a ${r ? recName(r.id) : "tu familia"} hoy?`,
          `Your account is open. Your debit card ends in ${res.card_last4}. Your balance is zero, but you can send today and pay later, up to ${usdSpoken(res.pay_later_limit, "en")}. Want to send something to ${r ? recName(r.id) : "your family"} today?`);
      }
      return S("Listo.", "Done.");
    }
    function cancel() {
      const res = tools.cancel_pending();
      ctx.awaiting = null; ctx.draft = {}; ctx.mode = null;
      if (res.status === "nothing_pending") return S("Va. ¿Qué más necesitas?", "Okay. What else do you need?");
      return S("Cancelado. No se movió nada. ¿Qué más necesitas?", "Cancelled. Nothing moved. What else do you need?");
    }

    // ── Onboarding ──
    function onboarding(t, raw) {
      if (ctx.awaiting === "onb_recipient") {
        const rel = findRelation(t);
        const city = findCity(t);
        if (!rel) return S("¿A quién le envías? Por ejemplo, a tu mamá, a tu papá o a tu hermana.", "Who do you send to? For example, your mom, your dad or your sister.");
        ctx.draft.rel = rel.key;
        if (!city) { ctx.awaiting = "onb_city"; return S(`¿En qué ciudad vive ${rel.poss.es}?`, `What city does ${rel.poss.en} live in?`); }
        tools.save_recipient({ relation: rel.key, city: city.label });
        ctx.awaiting = "onb_payday";
        return S(`Guardé a ${rel.poss.es} en ${city.label}. Ahora, ¿cada cuándo te pagan? Así te recuerdo enviar a tiempo.`, `I saved ${rel.poss.en} in ${city.label}. Now, how often do you get paid? So I can remind you to send on time.`);
      }
      if (ctx.awaiting === "onb_city") {
        const city = findCity(t);
        const label = city ? city.label : raw.trim().replace(/^(en|in)\s+/i, "");
        tools.save_recipient({ relation: ctx.draft.rel, city: label });
        ctx.awaiting = "onb_payday";
        const rel = REL[ctx.draft.rel];
        return S(`Guardé a ${rel.poss.es} en ${label}. ¿Cada cuándo te pagan?`, `I saved ${rel.poss.en} in ${label}. How often do you get paid?`);
      }
      if (ctx.awaiting === "onb_payday") {
        const pd = parsePayday(t) || { es: raw, en: raw };
        tools.save_payday({ payday: pd });
        tools.prepare_open_account();
        ctx.awaiting = "confirm";
        return S(`Anotado: ${pd.es.toLowerCase()}. Te abro tu cuenta Félix gratis, con tarjeta de débito Visa. ¿La abro?`, `Got it: ${pd.en.toLowerCase()}. I'll open your free Félix account with a Visa debit card. Should I open it?`);
      }
      return null;
    }

    // ── Entrada principal ──
    function handle(raw) {
      const t = norm(raw);
      if (!t) return S("No te escuché. ¿Me repites?", "I didn't catch that. Can you repeat?");

      // Cancelación siempre gana si hay algo pendiente
      if (state.pending && RX.no.test(t)) return cancel();
      if (ctx.awaiting === "confirm" && RX.yes.test(t)) return confirm();
      if (ctx.awaiting === "confirm" && RX.no.test(t)) return cancel();

      // Onboarding
      if (state.scenario === "new" && !state.account.open && ctx.awaiting && ctx.awaiting.startsWith("onb_") && !RX.human.test(t)) {
        const out = onboarding(t, raw); if (out) return out;
      }
      if (state.scenario === "new" && !state.account.open && !ctx.awaiting && !RX.human.test(t)) {
        ctx.awaiting = "onb_recipient"; const out = onboarding(t, raw); if (out) return out;
      }
      if (ctx.awaiting === "onb_first_send") {
        if (RX.no.test(t)) { ctx.awaiting = null; ctx.draft = {}; return S("Va. Aquí estoy cuando lo necesites.", "Okay. I'm here when you need me."); }
        const amt = parseAmount(t);
        if (amt) { ctx.draft.amount = amt.value; ctx.draft.currency = amt.currency; return trySend(); }
        if (RX.yes.test(t) || RX.send.test(t)) { ctx.awaiting = "send_amount"; return S(`¿Cuánto le envío a ${recName(ctx.draft.rid)}?`, `How much should I send ${recName(ctx.draft.rid)}?`); }
        ctx.awaiting = null;
      }

      // Slots pendientes
      if (ctx.awaiting === "send_recipient") {
        const r = resolveRecipient(state, t);
        if (r) {
          ctx.draft.rid = r.id; const a = parseAmount(t); if (a) { ctx.draft.amount = a.value; ctx.draft.currency = a.currency; }
          return ctx.mode === "paylater" ? payLaterNow() : trySend();
        }
      }
      if (ctx.awaiting === "send_amount") {
        const a = parseAmount(t);
        if (a) { ctx.draft.amount = a.value; ctx.draft.currency = a.currency; return ctx.mode === "paylater" ? payLaterNow() : trySend(); }
      }
      if (ctx.awaiting === "deposit_amount") { const a = parseAmount(t); if (a) return tryDeposit(a.value); }
      if (ctx.awaiting === "quote_amount") { const a = parseAmount(t); if (a) return tryQuote(a, ctx.draft.rid ? state.recipients.find((x) => x.id === ctx.draft.rid) : resolveRecipient(state, t)); }
      if (ctx.awaiting === "after_quote" && (RX.yes.test(t) || RX.send.test(t))) {
        const q = state.lastQuote; const r = resolveRecipient(state, t);
        ctx.mode = null; ctx.draft = { rid: r ? r.id : q && q.rid, amount: q && q.amount, currency: "USD" }; return trySend();
      }
      if (ctx.awaiting === "loan_amount") {
        const a = parseAmount(t);
        if (a) return tryLoan(a.value);
      }

      // Intenciones
      if (ctx.awaiting === "human_channel" || (RX.human.test(t) && (RX.whatsapp.test(t)))) {
        const ch = RX.whatsapp.test(t) ? "whatsapp" : RX.inApp.test(t) ? "app" : null;
        if (ch) { ctx.awaiting = null; tools.talk_to_human({ channel: ch }); return ch === "app" ? S("Te conecto con Lucía, del equipo Félix. Tarda unos dos minutos.", "I'm connecting you with Lucía from the Félix team. About two minutes.") : S("Listo, te abro WhatsApp con el equipo Félix.", "Done, I'm opening WhatsApp with the Félix team."); }
      }
      if (RX.human.test(t) || /\b(ayuda|help|soporte|support|ninja)\b/.test(t)) { ctx.awaiting = "human_channel"; return S("Claro. ¿Prefieres hablar con alguien del equipo aquí en la app o por WhatsApp?", "Sure. Do you want to talk to someone from the team here in the app or on WhatsApp?"); }
      if (RX.deposit.test(t) && !RX.send.test(t.replace(/deposit\w* a\b/, ""))) {
        const a = parseAmount(t);
        if (state.pending) tools.cancel_pending();
        if (!a) { ctx.awaiting = "deposit_amount"; return S("¿Cuánto quieres cargar a tu cuenta?", "How much do you want to add to your account?"); }
        return tryDeposit(a.value);
      }
      if (RX.quote.test(t)) {
        const a = parseAmount(t); const r = resolveRecipient(state, t);
        if (!a) { ctx.awaiting = "quote_amount"; ctx.draft = { rid: r ? r.id : null }; return S("¿Cuánto quieres calcular?", "How much should I calculate?"); }
        return tryQuote(a, r);
      }
      if (RX.topup.test(t) && !/mi cuenta/.test(t)) {
        const r = resolveRecipient(state, t); const a = parseAmount(t);
        const res = tools.prepare_topup({ recipient: r ? r.id : "", amount_usd: a ? a.value : 0 });
        if (res.status === "need_recipient") return S(`¿A quién le recargo? Tienes a ${listNames()}.`, `Who should I top up? You have ${listNames()}.`);
        if (res.status === "need_amount") { ctx.draft = { rid: r.id }; return S(`¿De cuánto la recarga a ${recName(r.id)}? Puede ser de 5, 10, 15 o 20 dólares.`, `How much for ${recName(r.id)}? 5, 10, 15 or 20 dollars.`); }
        ctx.awaiting = "confirm";
        return S(`Recargo ${usdSpoken(res.amount_usd, "es")} al ${res.carrier} de ${recName(res.recipient_id)}. ¿La hago?`, `I'll top up ${usdSpoken(res.amount_usd, "en")} to ${recName(res.recipient_id)}'s ${res.carrier}. Do it?`);
      }
      if (RX.bill.test(t) && !RX.send.test(t)) {
        if (/\b(que|cuales|mis|ver|muestra|tengo)\b/.test(t) && !/\b(paga|pagar|pagala|pay)\b/.test(t)) { tools.show_bills(); return S("Estos son tus pagos pendientes.", "Here are your upcoming bills."); }
        const res = tools.prepare_bill_payment({ bill: t });
        if (res.status === "not_found") { tools.show_bills(); return S("¿Cuál quieres pagar?", "Which one do you want to pay?"); }
        ctx.awaiting = "confirm";
        return S(`Pago ${usdSpoken(res.amount_usd, "es")} de ${res.provider}, vence el ${state.bills.find((b) => b.provider === res.provider).due.es}. ¿Lo pago de tu saldo?`, `I'll pay ${usdSpoken(res.amount_usd, "en")} to ${res.provider}. Pay it from your balance?`);
      }
      if (RX.profile.test(t)) { tools.show_profile(); return S("Este es tu perfil.", "Here's your profile."); }
      if (RX.product.test(t)) { const res = tools.show_product({ product: t }); return S("Te dejo un resumen en pantalla. ¿Quieres usarlo ahora?", "Here's a summary on screen. Want to use it now?"); }
      if (RX.payLater.test(t)) { const r = resolveRecipient(state, t); const a = parseAmount(t); ctx.draft = { rid: r ? r.id : ctx.draft.rid, amount: a ? a.value : ctx.draft.amount, currency: a ? a.currency : ctx.draft.currency || "USD" }; if (state.pending) tools.cancel_pending(); return payLaterNow(); }
      if (RX.installment.test(t)) {
        const res = tools.prepare_installment_payment();
        if (res.status === "nothing_due") return S("No tienes pagos pendientes. Vas al corriente.", "You have nothing due. You're all caught up.");
        ctx.awaiting = "confirm";
        return S(`Tu pago ${res.number} de ${res.of} es de ${usdSpoken(res.amount, "es")}. Lo pago de tu saldo. ¿Confirmo?`, `Payment ${res.number} of ${res.of} is ${usdSpoken(res.amount, "en")}. I'll pay it from your balance. Confirm?`);
      }
      const amtAny = parseAmount(t);
      const recAny = resolveRecipient(state, t);
      if (RX.send.test(t) || (recAny && amtAny)) {
        if (state.pending) tools.cancel_pending();
        ctx.mode = null; ctx.draft = { rid: recAny ? recAny.id : null, amount: amtAny ? amtAny.value : null, currency: amtAny ? amtAny.currency : "USD" };
        return trySend();
      }
      if (RX.loan.test(t)) { if (state.pending) tools.cancel_pending(); return tryLoan(amtAny ? amtAny.value : null); }
      if (RX.unfreeze.test(t)) { const res = tools.set_card_frozen({ frozen: false }); return res.status === "no_card" ? S("Aún no tienes tarjeta.", "You don't have a card yet.") : S(`Listo, tu tarjeta que termina en ${res.last4} ya funciona.`, `Done, your card ending in ${res.last4} works again.`); }
      if (RX.freeze.test(t)) { const res = tools.set_card_frozen({ frozen: true }); return res.status === "no_card" ? S("Aún no tienes tarjeta.", "You don't have a card yet.") : S(`Congelé tu tarjeta que termina en ${res.last4}. Nadie puede usarla. Cuando quieras, dime y la descongelo.`, `I froze your card ending in ${res.last4}. No one can use it. Tell me when you want it back on.`); }
      if (RX.movements.test(t)) { tools.show_movements(); const m = state.movements[0]; return m ? S(`Estos son tus últimos movimientos. El más reciente: ${m.title.es}, ${usdSpoken(Math.abs(m.amount), "es")}.`, `Here are your latest transactions. The most recent: ${m.title.en}, ${usdSpoken(Math.abs(m.amount), "en")}.`) : S("Aún no tienes movimientos.", "No transactions yet."); }
      if (RX.rates.test(t)) { tools.show_rates({}); return S(`Hoy el dólar está en ${CONFIG.rates.MX.rate} pesos mexicanos. Es buen día para enviar.`, `Today the dollar is at ${CONFIG.rates.MX.rate} Mexican pesos. It's a good day to send.`); }
      if (RX.balance.test(t)) { const res = tools.show_balance(); return S(`Tienes ${usdSpoken(res.balance, "es")} en tu cuenta, ganando ${CONFIG.apy}% anual. Y ${usdSpoken(res.credit_available, "es")} disponibles de crédito.`, `You have ${usdSpoken(res.balance, "en")} in your account, earning ${CONFIG.apy}% a year. And ${usdSpoken(res.credit_available, "en")} of credit available.`); }
      if (RX.card.test(t)) { const res = tools.show_card(); return res.status === "no_card" ? S("Aún no tienes tarjeta. Primero abrimos tu cuenta.", "No card yet. Let's open your account first.") : S(`Tu tarjeta de débito termina en ${res.last4} y está ${res.frozen ? "congelada" : "activa"}.`, `Your debit card ends in ${res.last4} and it's ${res.frozen ? "frozen" : "active"}.`); }
      if (recAny && !amtAny) { ctx.draft = { rid: recAny.id }; return trySend(); }
      if (amtAny && ctx.awaiting === null && ctx.draft.rid) { ctx.draft.amount = amtAny.value; ctx.draft.currency = amtAny.currency; return trySend(); }
      if (RX.thanks.test(t)) return S(`Con gusto, ${N()}.`, `Anytime, ${N()}.`);
      if (RX.greet.test(t)) return greet();
      if (RX.help.test(t)) return S("Puedo enviar dinero a tu familia, decirte el tipo de cambio, mostrar tu saldo, pagar tu préstamo, darte un crédito pequeño o congelar tu tarjeta. Dime qué necesitas.", "I can send money to your family, tell you the exchange rate, show your balance, pay your loan, give you a small loan or freeze your card. Tell me what you need.");
      if (state.pending && RX.yes.test(t)) return confirm();
      return S("No te entendí bien. Puedes decir, por ejemplo: mándale cien dólares a mi mamá.", "I didn't quite get that. You can say, for example: send my mom a hundred dollars.");
    }

    return { handle, greet, confirm, cancel, ctx };
  }

  g.FelixCore = { CONFIG, REL, seedState, makeTools, makeBrain, money, moneyShort, local, localSpoken, usdSpoken, tr, norm, parseAmount, findCity, findRelation, resolveRecipient, dateLabel, TODAY, addDays };
})(typeof window !== "undefined" ? window : globalThis);
