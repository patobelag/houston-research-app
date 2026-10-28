/* Félix Conversacional · UI + voz demo (navegador).
   Motor intercambiable: "demo" hoy, "eleven" en fase 2 con las mismas tools. */
(function () {
  "use strict";
  const C = window.FelixCore;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ───────── Textos de interfaz ─────────
  const UI = {
    es: {
      scenario: "Inicio", newUser: "Nuevo usuario", steady: "Ya con cuenta", light: "Claro", dark: "Oscuro", voice: "Voz",
      demoVoice: "Navegador (demo)", phase2: "fase 2", reset: "Reiniciar",
      tapToTalk: "Toca para hablar", listening: "Te escucho…", thinking: "Pensando…", speaking: "Toca para interrumpir",
      typeHere: "Escribe a Félix…", balance: "Saldo", today: "hoy", openFree: "Abre tu cuenta gratis",
      kb: "Teclado", mute: "Silencio", handsFree: "Manos libres", human: "Persona",
      noSR: "Tu navegador no reconoce voz. Escribe, o abre en Chrome o Safari.", micDenied: "Permite el micrófono para hablar con Félix.",
      noSpeech: "No te escuché. Toca y habla de nuevo.", hfOn: "Manos libres: Félix escucha después de hablar", hfOff: "Manos libres apagado",
      muteOn: "Félix en silencio. Lee los subtítulos.", muteOff: "Félix habla en voz alta",
      tryTitle: "Prueba decir", engineTitle: "Motor de voz", tips: "Cómo probar",
      tipsBody: "Toca el círculo y habla. Félix responde en voz alta y te pregunta lo que falte. Interrúmpelo tocando el círculo. Con manos libres, la conversación sigue sola.",
      engDemo: "Voz del navegador. Sirve para probar flujos. La voz natural llega con ElevenLabs en la fase 2.",
      srOk: "Reconocimiento de voz disponible", srNo: "Sin reconocimiento de voz en este navegador",
      confirm: "Confirmar", cancel: "Cancelar", done: "Hecho", cancelled: "Cancelado",
      sayConfirm: "Sí, confirmo", sayCancel: "Cancelar", shared: "Comprobante copiado",
      share: "Compartir comprobante", openAcc: "Abrir mi cuenta", notNow: "Ahora no",
      elNotSet: "sin configurar", connecting: "Conectando con Félix…", tapToEnd: "Te escucho · toca para terminar", talkToInterrupt: "Habla para interrumpirlo",
      elFail: "No pude conectar con ElevenLabs. Sigo con la voz del navegador.", elCode: "Este link necesita un código de acceso.",
      engEl: "Voz natural con ElevenLabs. Conversación continua: habla cuando quieras, interrumpe cuando quieras. Toca el círculo para terminar.",
      elEnded: "Conversación terminada",
    },
    en: {
      scenario: "Start", newUser: "New user", steady: "Existing user", light: "Light", dark: "Dark", voice: "Voice",
      demoVoice: "Browser (demo)", phase2: "phase 2", reset: "Restart",
      tapToTalk: "Tap to talk", listening: "Listening…", thinking: "Thinking…", speaking: "Tap to interrupt",
      typeHere: "Type to Félix…", balance: "Balance", today: "today", openFree: "Open your free account",
      kb: "Keyboard", mute: "Mute", handsFree: "Hands-free", human: "Person",
      noSR: "This browser can't recognize speech. Type, or open it in Chrome or Safari.", micDenied: "Allow the microphone to talk to Félix.",
      noSpeech: "I didn't hear you. Tap and talk again.", hfOn: "Hands-free: Félix listens after speaking", hfOff: "Hands-free off",
      muteOn: "Félix muted. Read the captions.", muteOff: "Félix speaks out loud",
      tryTitle: "Try saying", engineTitle: "Voice engine", tips: "How to test",
      tipsBody: "Tap the circle and talk. Félix answers out loud and asks for whatever is missing. Interrupt by tapping the circle. With hands-free on, the conversation keeps going.",
      engDemo: "Browser voice. Good for testing flows. The natural voice arrives with ElevenLabs in phase 2.",
      srOk: "Speech recognition available", srNo: "No speech recognition in this browser",
      confirm: "Confirm", cancel: "Cancel", done: "Done", cancelled: "Cancelled",
      sayConfirm: "Yes, confirm", sayCancel: "Cancel", shared: "Receipt copied",
      share: "Share receipt", openAcc: "Open my account", notNow: "Not now",
      elNotSet: "not set", connecting: "Connecting to Félix…", tapToEnd: "Listening · tap to end", talkToInterrupt: "Talk to interrupt",
      elFail: "I couldn't connect to ElevenLabs. Using the browser voice.", elCode: "This link needs an access code.",
      engEl: "Natural voice with ElevenLabs. Continuous conversation: talk any time, interrupt any time. Tap the circle to end.",
      elEnded: "Conversation ended",
    },
  };
  const prefs = { scenario: "steady", lang: "es", theme: "light", engine: "demo", handsFree: true, muted: false, kb: false };
  const t = (k) => UI[prefs.lang][k] || k;
  const S = (es, en) => (prefs.lang === "en" ? en : es);
  const tr = (v) => C.tr(v, prefs.lang);
  const money = (n) => C.money(n, prefs.lang);

  // ───────── Íconos ─────────
  const P = {
    mic: '<path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z"/><path d="M19 11a7 7 0 0 1-14 0M12 18v3"/>',
    kb: '<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><path d="M6.5 10h.01M10 10h.01M13.5 10h.01M17 10h.01M7 14h10"/>',
    send: '<path d="M5 12h13M13 6l6 6-6 6"/>',
    spk: '<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
    spkOff: '<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="m22 9-6 6M16 9l6 6"/>',
    loop: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
    stop: '<rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor"/>',
    person: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    snow: '<path d="M12 2v20M4.9 6.5l14.2 11M19.1 6.5 4.9 17.5M9.5 3.5 12 6l2.5-2.5M9.5 20.5 12 18l2.5 2.5"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    share: '<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
    signal: '<path d="M3 18h2v-3H3zM8 18h2v-6H8zM13 18h2V9h-2zM18 18h2V6h-2z" fill="currentColor" stroke="none"/>',
    batt: '<rect x="2" y="7" width="18" height="10" rx="3"/><rect x="4" y="9" width="13" height="6" rx="1.5" fill="currentColor"/><path d="M22 10.5v3"/>',
  };
  const I = (n, s = 22, w = 2) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${P[n]}</svg>`;

  // ───────── Sesión ─────────
  let state, tools, brain, msgs, cards, timers, cardSeq = 0, turnCards = null, status = "idle", started = false, lastVia = null;
  let elReady = null, accessCode = null; // ElevenLabs: null = revisando, false = no configurado, true = listo
  const isEL = () => prefs.engine === "eleven" && elReady === true;
  const hooks = {
    lang: () => prefs.lang,
    card(type, data) {
      const id = "k" + ++cardSeq;
      cards[id] = { id, type, data, resolved: null };
      if (turnCards) turnCards.push(id);
      else if (EL.active()) EL.bufferCard(id);
      else { msgs.push({ role: "card", id }); render(); }
      return id;
    },
    update(id, patch) { if (cards[id]) Object.assign(cards[id], patch); render(); },
    later(ms, fn) { timers.push(setTimeout(fn, ms)); },
    notify(txt) {
      if (EL.active()) { msgs.push({ role: "felix", text: txt[prefs.lang] }); render(); EL.context(txt.en); return; }
      felixSays(txt[prefs.lang], { interruptible: true, auto: true });
    },
  };

  function resetSession() {
    (timers || []).forEach(clearTimeout);
    timers = []; msgs = []; cards = {}; started = false;
    Voice.stopAll();
    EL.stop();
    state = C.seedState(prefs.scenario);
    tools = C.makeTools(state, hooks);
    brain = C.makeBrain(state, tools, () => prefs.lang);
    msgs.push({ role: "felix", text: brain.greet() });
    setStatus("idle");
    render();
  }

  // Turno del usuario (voz, teclado, chip o botón)
  function userSays(text, via) {
    text = String(text || "").trim();
    if (!text) return;
    if (isEL()) {
      msgs.push({ role: "user", text, via }); EL.lastTyped = text; render();
      if (EL.active()) EL.send(text); else EL.start(text);
      return;
    }
    started = true;
    if (via !== "tap") lastVia = via; // tocar una tarjeta no corta la conversación por voz
    Voice.stopSpeaking();
    msgs.push({ role: "user", text, via });
    setCaption("");
    setStatus("thinking");
    render();
    setTimeout(() => {
      turnCards = [];
      let reply;
      try { reply = brain.handle(text); } catch (e) { console.error(e); reply = S("Algo falló. Probemos otra vez.", "Something failed. Let's try again."); }
      const created = turnCards; turnCards = null;
      felixSays(reply, { cards: created });
    }, 450);
  }

  function felixSays(text, opts = {}) {
    if (opts.auto && (status === "listening" || status === "thinking")) {
      // aviso asíncrono mientras el usuario habla: se muestra sin voz
      msgs.push({ role: "felix", text }); render(); return;
    }
    msgs.push({ role: "felix", text });
    (opts.cards || []).forEach((id) => msgs.push({ role: "card", id }));
    render();
    if (prefs.muted || !started) { setStatus("idle"); afterFelix(); return; }
    setStatus("speaking");
    Voice.speak(text, prefs.lang).then((completed) => {
      if (status !== "speaking") return; // interrumpido
      setStatus("idle");
      if (completed) afterFelix();
    });
  }
  function afterFelix() {
    if (prefs.handsFree && started && lastVia === "voz" && Voice.canListen && !prefs.kb) setTimeout(() => { if (status === "idle") startListening(); }, 250);
  }

  function startListening() {
    if (!Voice.canListen) { prefs.kb = true; toast(t("noSR")); render(); setTimeout(() => $("#kb-input").focus(), 50); return; }
    started = true;
    setStatus("listening");
    setCaption(`<span class="ph">${t("listening")}</span>`);
    Voice.listen(prefs.lang, {
      onPartial: (txt) => setCaption(esc(txt)),
      onLevel: (v) => $("#orb").style.setProperty("--lvl", v.toFixed(3)),
    }).then((res) => {
      $("#orb").style.setProperty("--lvl", 0);
      if (status !== "listening") return;
      setCaption("");
      if (res.text) userSays(res.text, "voz");
      else {
        setStatus("idle");
        if (res.error === "not-allowed") toast(t("micDenied"));
        else if (res.error === "no-speech") toast(t("noSpeech"));
      }
    });
  }

  function onOrb() {
    if (isEL()) {
      if (EL.connecting) return;
      if (EL.active()) { EL.stop(); toast(t("elEnded")); } else EL.start();
      return;
    }
    if (status === "speaking") { Voice.stopSpeaking(); setStatus("idle"); startListening(); return; }
    if (status === "listening") { Voice.stopListening(); return; }
    if (status === "thinking") return;
    startListening();
  }

  // ───────── Voz demo (Web Speech API) ─────────
  const Voice = (() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const synth = window.speechSynthesis;
    let rec = null, recResolve = null, stream = null, ctx = null, analyser = null, raf = 0, speakResolve = null;
    const PREF = {
      es: ["Paulina", "Mónica", "Monica", "Google español de Estados Unidos", "Microsoft Dalia", "Microsoft Sabina", "Microsoft Paloma", "Marisol", "Google español", "Juan", "Jorge"],
      en: ["Samantha", "Google US English", "Microsoft Aria", "Microsoft Jenny", "Ava", "Allison", "Karen"],
    };
    function pickVoice(lang) {
      if (!synth) return null;
      const vs = synth.getVoices();
      const want = lang === "en" ? /^en(-|_)?(US)?/i : /^es(-|_)?(MX|US|419)?/i;
      for (const name of PREF[lang]) { const v = vs.find((x) => x.name.includes(name) && want.test(x.lang)); if (v) return v; }
      return vs.find((x) => (lang === "en" ? /^en-US/i : /^es-(MX|US|419)/i).test(x.lang)) || vs.find((x) => want.test(x.lang)) || null;
    }
    if (synth) { synth.getVoices(); synth.onvoiceschanged = () => synth.getVoices(); }

    async function meter(onLevel) {
      try {
        if (!stream) stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
        ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === "suspended") await ctx.resume();
        const src = ctx.createMediaStreamSource(stream);
        analyser = ctx.createAnalyser(); analyser.fftSize = 512; src.connect(analyser);
        const buf = new Uint8Array(analyser.fftSize);
        const loop = () => {
          analyser.getByteTimeDomainData(buf);
          let sum = 0; for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
          onLevel(Math.min(1, Math.sqrt(sum / buf.length) * 5));
          raf = requestAnimationFrame(loop);
        };
        loop();
      } catch (e) { /* el medidor es opcional */ }
    }
    function stopMeter() { cancelAnimationFrame(raf); raf = 0; }

    return {
      canListen: !!SR,
      canSpeak: !!synth,
      listen(lang, { onPartial, onLevel }) {
        return new Promise((resolve) => {
          try { if (rec) rec.abort(); } catch (e) {}
          rec = new SR();
          rec.lang = lang === "en" ? "en-US" : "es-US";
          rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
          let finalText = "", live = "", err = null;
          recResolve = resolve;
          rec.onresult = (e) => {
            live = ""; finalText = "";
            for (let i = 0; i < e.results.length; i++) {
              if (e.results[i].isFinal) finalText += e.results[i][0].transcript; else live += e.results[i][0].transcript;
            }
            onPartial((finalText + " " + live).trim());
          };
          rec.onerror = (e) => { err = e.error; };
          rec.onend = () => { stopMeter(); const r = recResolve; recResolve = null; rec = null; if (r) r({ text: (finalText || live).trim(), error: finalText || live ? null : err || "no-speech" }); };
          try { rec.start(); if (onLevel) meter(onLevel); } catch (e) { stopMeter(); resolve({ text: "", error: "start" }); }
        });
      },
      stopListening() { try { rec && rec.stop(); } catch (e) {} },
      speak(text, lang) {
        return new Promise((resolve) => {
          if (!synth) return resolve(true);
          synth.cancel();
          const u = new SpeechSynthesisUtterance(text.replace(/\$/g, ""));
          const v = pickVoice(lang); if (v) u.voice = v;
          u.lang = v ? v.lang : lang === "en" ? "en-US" : "es-MX";
          u.rate = 1.04; u.pitch = 1;
          speakResolve = resolve;
          const fin = (ok) => { if (speakResolve === resolve) { speakResolve = null; clearInterval(keep); resolve(ok); } };
          u.onend = () => fin(true); u.onerror = () => fin(false);
          // Chrome corta frases largas: lo mantenemos vivo
          const keep = setInterval(() => { if (!synth.speaking) return; synth.pause(); synth.resume(); }, 10000);
          synth.speak(u);
        });
      },
      stopSpeaking() { if (synth) synth.cancel(); if (speakResolve) { const r = speakResolve; speakResolve = null; r(false); } },
      stopAll() { this.stopSpeaking(); try { rec && rec.abort(); } catch (e) {} stopMeter(); },
    };
  })();

  // ───────── Voz ElevenLabs (Agents, WebRTC) ─────────
  const SDK_URL = "https://cdn.jsdelivr.net/npm/@elevenlabs/client@1.28.0/+esm";
  const EL = (() => {
    let conv = null, mod = null, buf = [], flushT = 0, greeting = null, raf = 0, startedAt = 0;
    const api = { connecting: false, lastTyped: null };

    function contextString() {
      const s = state;
      const recs = s.recipients.map((r) => `${r.name} (${r.rel || "familiar"}, id ${r.id}, ${r.city}, ${r.country})`).join("; ") || "ninguno";
      return [
        `Nombre: ${s.user.name}. Idioma de la interfaz: ${prefs.lang === "en" ? "inglés" : "español"}.`,
        `Escenario: ${s.scenario === "new" ? "usuario nuevo" : "usuario actual"}. account_open = ${s.account.open}.`,
        s.account.open ? `Saldo: $${s.account.balance}. Tarjeta débito •••• ${s.account.card ? s.account.card.last4 : "-"}${s.account.card && s.account.card.frozen ? " (congelada)" : ""}.` : "Aún no tiene cuenta ni tarjeta.",
        `Crédito disponible: $${(s.credit.limit - s.credit.used).toFixed(2)}.`,
        s.loan ? `Préstamo activo: cuota ${s.loan.paid + 1} de ${s.loan.n}, $${s.loan.installment}, vence ${s.loan.due.es}.` : "Sin préstamo activo.",
        `Familiares guardados: ${recs}.`,
        `Día de pago: ${s.payday ? tr(s.payday) : "no definido"}.`,
        `Fecha de hoy: 27 de octubre de 2026.`,
      ].join("\n");
    }

    function clientTools() {
      const out = {};
      Object.keys(tools).forEach((name) => {
        out[name] = async (params) => {
          const p = Object.assign({}, params || {});
          if (name === "save_payday" && typeof p.payday === "string") p.payday = { es: p.payday, en: p.payday };
          let res;
          try { res = tools[name](p); } catch (e) { console.error(e); res = { status: "error" }; }
          renderTop(); renderChips();
          return JSON.stringify(res);
        };
      });
      return out;
    }

    function flush() {
      clearTimeout(flushT);
      if (!buf.length) return;
      buf.forEach((id) => msgs.push({ role: "card", id }));
      buf = []; render();
    }

    function levels() {
      cancelAnimationFrame(raf);
      const loop = async () => {
        if (!conv) return;
        try {
          const v = status === "speaking" ? await conv.getOutputVolume() : await conv.getInputVolume();
          $("#orb").style.setProperty("--lvl", Math.min(1, v * 1.6).toFixed(3));
        } catch (e) {}
        raf = requestAnimationFrame(loop);
      };
      loop();
    }

    api.active = () => !!conv;
    api.bufferCard = (id) => { buf.push(id); clearTimeout(flushT); flushT = setTimeout(flush, 2500); };
    api.context = (text) => { try { conv && conv.sendContextualUpdate(text); } catch (e) {} };
    api.send = (text) => { try { conv.sendUserMessage(text); setStatus("thinking"); } catch (e) { console.error(e); } };

    api.start = async (firstText) => {
      if (conv || api.connecting) return;
      api.connecting = true; started = true;
      setStatus("thinking"); $("#hint").textContent = t("connecting");
      try {
        mod = mod || (await import(SDK_URL));
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const r = await fetch("/api/el-token", { headers: accessCode ? { "x-access-code": accessCode } : {} });
        if (r.status === 401) { toast(t("elCode")); throw new Error("code"); }
        if (!r.ok) throw new Error("token " + r.status);
        const { token } = await r.json();
        startedAt = Date.now();
        const onlyGreeting = msgs.length === 1 && msgs[0].role === "felix";
        greeting = onlyGreeting && !firstText ? msgs[0].text : null;
        conv = await mod.Conversation.startSession({
          conversationToken: token,
          connectionType: "webrtc",
          dynamicVariables: { user_context: contextString(), first_message: greeting || " " },
          clientTools: clientTools(),
          onMessage: (m) => {
            const who = m.source || m.role;
            // Quita etiquetas de expresión de la voz, por ejemplo [happy]
            const text = String(m.message || "").replace(/\[[a-z _-]{2,24}\]\s*/gi, "").trim();
            if (!text) return;
            if (who === "user") {
              if (api.lastTyped && api.lastTyped.trim() === text) { api.lastTyped = null; return; }
              msgs.push({ role: "user", text, via: "voz" }); setCaption(""); render();
            } else {
              if (greeting && text === greeting.trim()) { greeting = null; return; }
              msgs.push({ role: "felix", text }); flush(); render();
            }
          },
          onModeChange: (m) => { const mode = m && m.mode; if (mode === "speaking") setStatus("speaking"); else if (mode === "listening") setStatus("listening"); },
          onStatusChange: (s) => { if (s && s.status === "disconnected") api.cleanup(); },
          onDisconnect: (d) => {
            const early = Date.now() - startedAt < 4000;
            api.cleanup();
            if (early) { console.error("ElevenLabs desconectó al inicio", d); toast(t("elFail")); }
          },
          onError: (e) => { console.error("ElevenLabs", e); },
        });
        if (prefs.muted) { try { conv.setVolume({ volume: 0 }); } catch (e) {} }
        api.connecting = false;
        setStatus("listening");
        levels();
        if (firstText) api.send(firstText);
      } catch (e) {
        console.error(e);
        api.connecting = false; conv = null;
        if (String(e.message) !== "code") { toast(t("elFail")); prefs.engine = "demo"; }
        setStatus("idle"); render();
      }
    };
    api.cleanup = () => { flush(); conv = null; api.connecting = false; cancelAnimationFrame(raf); $("#orb").style.setProperty("--lvl", 0); if (status !== "idle") setStatus("idle"); };
    api.stop = () => { const c = conv; api.cleanup(); if (c) { try { c.endSession(); } catch (e) {} } };
    api.setMuted = (m) => { try { conv && conv.setVolume({ volume: m ? 0 : 1 }); } catch (e) {} };
    return api;
  })();

  // ───────── Estado visual ─────────
  function setStatus(s) {
    status = s;
    const orb = $("#orb");
    orb.className = "orb " + s;
    $("#orb-icon").innerHTML = s === "speaking" ? '<span class="bars"><i></i><i></i><i></i><i></i></span>' : s === "thinking" ? '<span class="tdots"><i></i><i></i><i></i></span>' : I("mic", 34, 2);
    orb.setAttribute("aria-label", s === "speaking" ? t("speaking") : t("tapToTalk"));
    const el = isEL() && EL.active();
    $("#hint").textContent = { idle: t("tapToTalk"), listening: el ? t("tapToEnd") : t("listening"), thinking: t("thinking"), speaking: el ? t("talkToInterrupt") : t("speaking") }[s];
    renderChips();
  }
  function setCaption(html) { $("#caption").innerHTML = html; }
  let toastT = 0;
  function toast(msg) { const el = $("#toast"); el.textContent = msg; el.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("on"), 2600); }

  // ───────── Render ─────────
  function render() {
    document.documentElement.lang = prefs.lang;
    document.documentElement.dataset.theme = prefs.theme;
    document.querySelectorAll("[data-i]").forEach((el) => { el.textContent = t(el.dataset.i); });
    const segs = { "#seg-scenario": prefs.scenario, "#seg-lang": prefs.lang, "#seg-theme": prefs.theme, "#seg-engine": prefs.engine };
    for (const k in segs) document.querySelectorAll(k + " button").forEach((b) => b.classList.toggle("on", b.dataset.v === segs[k]));

    $("#sbar-icons").innerHTML = I("signal", 17) + I("batt", 22, 1.6);
    renderTop();
    renderConvo();
    renderChips();
    renderSides();

    $("#btn-kb").innerHTML = I("kb", 22, 1.8); $("#btn-kb").classList.toggle("on", prefs.kb); $("#btn-kb").title = t("kb");
    $("#btn-mute").innerHTML = I(prefs.muted ? "spkOff" : "spk", 22, 1.8); $("#btn-mute").classList.toggle("on", !prefs.muted); $("#btn-mute").title = t("mute");
    $("#btn-hf").innerHTML = I("loop", 21, 1.8); $("#btn-hf").classList.toggle("on", prefs.handsFree || isEL()); $("#btn-hf").title = t("handsFree");
    $("#btn-hf").style.visibility = isEL() ? "hidden" : "visible";
    const elBtn = $("#eng-el");
    elBtn.disabled = elReady !== true;
    $("#eng-el-note").textContent = elReady === false ? " · " + t("elNotSet") : "";
    $("#btn-human").innerHTML = I("person", 21, 1.8); $("#btn-human").title = t("human");
    $("#kb").classList.toggle("on", prefs.kb);
    $("#kb-input").placeholder = t("typeHere");
    $("#kb-send").innerHTML = I("send", 20, 2.2);
  }

  function renderTop() {
    const a = state.account;
    const r = C.CONFIG.rates.MX;
    $("#top").innerHTML = `<div class="avatar">J</div>` +
      (a.open
        ? `<button class="pill" data-say="${esc(S("¿Cuánto tengo?", "How much do I have?"))}"><small>${t("balance")}</small><b>${money(a.balance)}</b></button>`
        : `<span class="pill mute">${t("openFree")}</span>`) +
      `<span class="spacer"></span><button class="pill rate" data-say="${esc(S("¿A cómo está el dólar?", "What's the dollar at?"))}"><small>MXN ${t("today")}</small><b>$${r.rate}</b></button>`;
  }

  function renderConvo() {
    const el = $("#convo");
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    const lastF = msgs.map((m) => m.role).lastIndexOf("felix");
    const html = ['<div class="spacer-top"></div>'];
    msgs.forEach((m, i) => {
      if (m.role === "felix") html.push(`<div class="m-f ${i === lastF ? "latest" : ""}">${esc(m.text)}</div>`);
      else if (m.role === "user") html.push(`<div class="m-u">${esc(m.text)}${m.via === "voz" ? `<span class="via">${I("mic", 10, 2.4)} ${S("por voz", "by voice")}</span>` : ""}</div>`);
      else if (m.role === "card" && cards[m.id]) html.push(cardHTML(cards[m.id]));
    });
    const before = el.dataset.n | 0;
    el.innerHTML = html.join("");
    if (msgs.length !== before) { const kids = el.children; for (let i = Math.max(1, before + 1); i < kids.length; i++) kids[i].classList.add("fade-in"); }
    el.dataset.n = msgs.length;
    if (atBottom || msgs.length !== before) el.scrollTop = el.scrollHeight;
  }

  function chipList() {
    let aw = brain.ctx.awaiting;
    if (isEL()) {
      aw = null;
      if (!state.account.open) aw = state.recipients.length === 0 ? "onb_recipient" : !state.payday ? "onb_payday" : null;
    }
    if (state.pending || aw === "confirm") return [[t("sayConfirm"), true], [t("sayCancel")]];
    if (aw === "onb_recipient") return [[S("A mi mamá en Guadalajara", "My mom in Guadalajara")], [S("A mi papá en Morelia", "My dad in Morelia")], [S("A mi hermana en Bogotá", "My sister in Bogotá")]];
    if (aw === "onb_city") return [["Guadalajara"], ["Ciudad de México"], ["Guatemala"]];
    if (aw === "onb_payday") return [[S("Cada viernes", "Every Friday")], [S("Cada quince días", "Every two weeks")], [S("Una vez al mes", "Once a month")]];
    if (aw === "onb_first_send") return [[S("Sí, 100 dólares", "Yes, $100"), true], [S("Ahora no", "Not now")]];
    if (aw === "send_recipient") return state.recipients.map((r) => [tr(r.short)]);
    if (aw === "send_amount") return [["$50"], ["$100"], ["$200"], [S("2,000 pesos", "2,000 pesos")]];
    if (aw === "loan_amount") return [["$100"], ["$200"], ["$300"]];
    if (!state.account.open) return [];
    return [[S("Mándale $100 a mi mamá", "Send Mom $100")], [S("¿A cómo está el dólar?", "What's the dollar at?")], [S("Paga mi cuota", "Pay my installment")], [S("Necesito un préstamo de $200", "I need a $200 loan")], [S("Congela mi tarjeta", "Freeze my card")]];
  }
  function renderChips() {
    const el = $("#chips");
    if (!brain || status === "listening" || status === "thinking") { el.innerHTML = ""; return; }
    el.innerHTML = chipList().map(([txt, pri]) => `<button class="chip-b ${pri ? "pri" : ""}" data-say="${esc(txt)}">${esc(txt)}</button>`).join("");
  }

  function renderSides() {
    const tries = prefs.scenario === "new"
      ? [S("A mi mamá en Guadalajara", "My mom in Guadalajara"), S("Me pagan cada viernes", "I get paid every Friday"), S("Sí, ábrela", "Yes, open it"), S("Sí, 100 dólares", "Yes, $100"), S("Quiero hablar con una persona", "I want to talk to a person")]
      : [S("Mándale 100 dólares a mi mamá", "Send my mom $100"), S("Envíale 2,000 pesos a mi papá", "Send my dad 2,000 pesos"), S("Mándale 1,300 a Ana", "Send Ana $1,300"), S("Envía hoy y paga después 150 a mi tío Carlos", "Send now, pay later $150 to Uncle Carlos"), S("Necesito un préstamo de 200 dólares", "I need a $200 loan"), S("Paga mi cuota", "Pay my installment"), S("Congela mi tarjeta", "Freeze my card"), S("Muéstrame mis movimientos", "Show my transactions"), S("¿Cuánto tengo?", "How much do I have?")];
    $("#side-left").innerHTML = `<h3>${t("tryTitle")}</h3><div class="try">${tries.map((x) => `<button data-say="${esc(x)}">“${esc(x)}”</button>`).join("")}</div>`;
    $("#side-right").innerHTML = `<h3>${t("tips")}</h3><p style="margin-bottom:22px">${t("tipsBody")}</p>
      <h3>${t("engineTitle")}</h3>
      ${isEL() ? `<div class="status-line"><span class="dot"></span>ElevenLabs</div><p>${t("engEl")}</p>`
        : `<div class="status-line"><span class="dot ${Voice.canListen ? "" : "warn"}"></span>${Voice.canListen ? t("srOk") : t("srNo")}</div><p>${t("engDemo")}</p>`}`;
  }

  // ───────── Tarjetas ─────────
  const recOf = (rid) => state.recipients.find((r) => r.id === rid);
  const ini = (r) => (tr(r.short) || r.name).split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const flag = (c) => (C.CONFIG.rates[c] || {}).flag || "";
  function whoHTML(r) {
    return `<div class="who"><div class="ini">${esc(ini(r))}</div><div><div class="nm">${esc(tr(r.short))} · ${esc(r.name)}</div><div class="ds">${flag(r.country)} ${esc(r.city)} · ${esc(tr(r.method))}</div></div></div>`;
  }
  function acts(card, okLabel, noLabel) {
    if (card.resolved === "done") return `<div class="done-note">${I("check", 16, 2.6)} ${t("done")}</div>`;
    if (card.resolved === "cancelled") return `<div class="cancel-note">${t("cancelled")}</div>`;
    return `<div class="acts"><button class="btn sec" data-say="${esc(t("sayCancel"))}">${esc(noLabel || t("cancel"))}</button><button class="btn pri" data-say="${esc(t("sayConfirm"))}">${esc(okLabel || t("confirm"))}</button></div>`;
  }
  function dcardHTML(last4, frozen) {
    return `<div class="dcard ${frozen ? "frozen" : ""}"><span class="glow"></span><div style="display:flex;justify-content:space-between;align-items:center"><span class="brand">Félix</span><span style="font-size:11px;opacity:.8">${S("Débito", "Debit")}</span></div><span class="chip"></span><div class="num">•••• •••• •••• ${last4}</div><div class="ft"><span>JUAN HERNÁNDEZ</span><span class="visa">VISA</span></div>${frozen ? `<div class="ice"><div style="display:grid;place-items:center;gap:4px">${I("snow", 26, 2)}${S("Congelada", "Frozen")}</div></div>` : ""}</div>`;
  }
  function cardHTML(c) {
    const d = c.data, cls = `card ${c.resolved ? "resolved-" + c.resolved : ""}`;
    const head = (title, badge, bcls) => `<div class="c-head"><span class="c-title">${title}</span>${badge ? `<span class="badge ${bcls || ""}">${badge}</span>` : ""}</div>`;
    switch (c.type) {
      case "balance": {
        const a = state.account;
        return `<div class="${cls}">${head(S("Tu cuenta Félix", "Your Félix account"), `↗ ${C.CONFIG.apy}% ${S("anual", "APY")}`, "ok")}
          <div class="big">${money(a.balance)}</div><div class="sub">${S("Saldo disponible", "Available balance")}</div>
          <div class="rows"><div class="row"><span>${S("Tarjeta de débito", "Debit card")}</span><b>•••• ${a.card ? a.card.last4 : "—"} · ${a.card && a.card.frozen ? S("Congelada", "Frozen") : S("Activa", "Active")}</b></div>
          <div class="row"><span>${S("Crédito disponible", "Credit available")}</span><b>${money(state.credit.limit - state.credit.used)}</b></div></div></div>`;
      }
      case "rates": {
        const rows = Object.entries(C.CONFIG.rates).map(([k, v]) => `<div class="it"><span class="t">${v.flag} ${v.name[prefs.lang]}</span><b>${v.sym}${v.rate.toLocaleString("en-US")} ${v.cur}</b></div>`).join("");
        return `<div class="${cls}">${head(S("Tipo de cambio por dólar", "Rate per dollar"), S("Buen día para enviar", "Good day to send"), "ok")}<div class="list">${rows}</div></div>`;
      }
      case "card": {
        const k = state.account.card;
        return `<div class="${cls}">${head(S("Tarjeta de débito", "Debit card"))}${dcardHTML(k.last4, k.frozen)}
          <button class="toggle" style="width:100%" data-say="${esc(k.frozen ? S("Descongela mi tarjeta", "Unfreeze my card") : S("Congela mi tarjeta", "Freeze my card"))}"><span>${S("Congelar tarjeta", "Freeze card")}</span><span class="sw ${k.frozen ? "on" : ""}"></span></button></div>`;
      }
      case "movements": {
        const rows = state.movements.slice(0, 5).map((m) => `<div class="it"><div><div class="t">${esc(tr(m.title))}</div><div class="d">${esc(tr(m.date))}${m.note ? " · " + esc(tr(m.note)) : ""}</div></div><span class="${m.amount > 0 ? "pos" : "neg"}">${m.amount > 0 ? "+" : ""}${money(m.amount)}</span></div>`).join("");
        return `<div class="${cls}">${head(S("Movimientos", "Activity"))}<div class="list">${rows || `<div class="sub">${S("Sin movimientos", "No activity")}</div>`}</div></div>`;
      }
      case "send": {
        const r = recOf(d.rid), rt = C.CONFIG.rates[r.country];
        return `<div class="${cls}">${head(S("Envío", "Transfer"), S("Llega en minutos", "Arrives in minutes"), "cyan")}${whoHTML(r)}
          <div class="receive"><div class="lbl">${S("Recibe", "They get")}</div><div class="amt">${C.local(d.receive, r.country, prefs.lang)}</div></div>
          <div class="rows"><div class="row"><span>${S("Envías", "You send")}</span><b>${money(d.amount)}</b></div>
          <div class="row"><span>${S("Comisión", "Fee")}</span><b>${money(d.fee)}</b></div>
          <div class="row"><span>${S("Tipo de cambio", "Exchange rate")}</span><b>1 USD = ${rt.rate} ${rt.cur}</b></div>
          <div class="row"><span>${S("Pagas con", "Paid with")}</span><b>${S("Saldo Félix", "Félix balance")}</b></div>
          <div class="row total"><span>Total</span><b>${money(d.total)}</b></div></div>${acts(c, S("Enviar", "Send"))}</div>`;
      }
      case "paylater": {
        const r = recOf(d.rid), p = d.plan;
        const sched = p.dates.map((dt, i) => `<div><b>${money(p.each)}</b><span>${C.dateLabel(new Date(dt), prefs.lang)}</span></div>`).join("");
        return `<div class="${cls}">${head(S("Envía hoy, paga después", "Send now, pay later"), S("Sin intereses", "No interest"), "ok")}
          ${d.shortfall > 0 ? `<div class="warnbox">${S("Te faltan", "You're short")} ${money(d.shortfall)} ${S("en tu saldo", "in your balance")}</div>` : ""}
          ${whoHTML(r)}
          <div class="receive"><div class="lbl">${S("Recibe hoy", "They get today")}</div><div class="amt">${C.local(d.receive, r.country, prefs.lang)}</div></div>
          <div class="sched">${sched}</div>
          <div class="rows"><div class="row"><span>${S("Envío", "Transfer")}</span><b>${money(d.amount)}</b></div>
          <div class="row"><span>${S("Comisión de envío", "Transfer fee")}</span><b>${money(p.fee)}</b></div>
          <div class="row"><span>${S("Cargo fijo paga después", "Pay-later fixed fee")}</span><b>${money(p.plFee)}</b></div>
          <div class="row total"><span>${S("Total a pagar", "Total to repay")}</span><b>${money(p.total)}</b></div></div>
          ${acts(c, S("Enviar ahora", "Send now"))}</div>`;
      }
      case "tracking": {
        const tx = state.transfers[d.tid], r = recOf(tx.rid);
        const lbl = [S("Enviado", "Sent"), S("En camino", "On the way"), S("Depositado", "Delivered")];
        const tm = [S("Hoy, 9:41", "Today, 9:41"), S("Procesando con el banco", "Processing with the bank"), S("Listo para usar", "Ready to use")];
        const steps = lbl.map((l, i) => `<div class="step ${i <= tx.step ? (i === tx.step && i < 2 ? "now on" : "on") : ""}"><span class="bul">${i <= tx.step ? I("check", 12, 3) : ""}</span><div><div class="lb">${l}</div><div class="tm">${i <= tx.step ? tm[i] : ""}</div></div></div>`).join("");
        return `<div class="${cls}">${head(S("Seguimiento", "Tracking"), tx.step === 2 ? S("Entregado", "Delivered") : S("En proceso", "In progress"), tx.step === 2 ? "ok" : "cyan")}
          ${whoHTML(r)}<div class="receive"><div class="lbl">${S("Recibe", "They get")}</div><div class="amt">${C.local(tx.receive, r.country, prefs.lang)}</div></div>
          <div class="steps">${steps}</div>
          <div class="rows"><div class="row"><span>${S("Folio", "Reference")}</span><b>${tx.ref}</b></div>${tx.via === "paylater" ? `<div class="row"><span>${S("Pagado con", "Paid with")}</span><b>${S("Paga después", "Pay later")}</b></div>` : ""}</div>
          ${tx.step === 2 ? `<div class="acts"><button class="btn sec" data-toast="shared">${I("share", 16, 2)} ${t("share")}</button></div>` : ""}</div>`;
      }
      case "loan_offer": {
        const p = d.plan;
        return `<div class="${cls}">${head(S("Crédito Félix", "Félix loan"), S("Aprobado", "Approved"), "ok")}
          <div class="big">${money(p.amount)}</div><div class="sub">${S("Lo recibes hoy en tu cuenta", "Deposited today to your account")}</div>
          <div class="rows"><div class="row"><span>${S("Plazo", "Term")}</span><b>${p.months} ${S("meses", "months")}</b></div>
          <div class="row"><span>${S("Pagos", "Payments")}</span><b>${p.payments} × ${money(p.each)} ${S("cada 15 días", "every 2 weeks")}</b></div>
          <div class="row"><span>${S("Primer pago", "First payment")}</span><b>${C.dateLabel(new Date(p.first), prefs.lang)}</b></div>
          <div class="row"><span>${S("Costo del crédito", "Cost of credit")}</span><b>${money(p.cost)}</b></div>
          <div class="row total"><span>${S("Total a pagar", "Total to repay")}</span><b>${money(p.total)}</b></div></div>
          <div class="note">${S("Valores de prueba para el prototipo.", "Test values for the prototype.")}</div>${acts(c, S("Aceptar", "Accept"))}</div>`;
      }
      case "loan_done":
        return `<div class="${cls}">${head(S("Crédito Félix", "Félix loan"), S("Depositado", "Deposited"), "ok")}<div class="big">+${money(d.plan.amount)}</div><div class="sub">${S("Nuevo saldo", "New balance")}: ${money(state.account.balance)}</div></div>`;
      case "installment": case "installment_paid": {
        const l = state.loan;
        return `<div class="${cls}">${head(S("Préstamo Félix", "Félix loan"), c.type === "installment_paid" ? S("Pagado", "Paid") : S("Vence", "Due") + " " + l.due[prefs.lang].split(" ").slice(0, 2).join(" "), c.type === "installment_paid" ? "ok" : "warn")}
          <div class="big">${money(l.installment)}</div><div class="sub">${S("Pago", "Payment")} ${Math.min(l.paid + (c.type === "installment" && !c.resolved ? 1 : 0), l.n)} ${S("de", "of")} ${l.n}</div>
          <div class="progress"><i style="width:${(l.paid / l.n) * 100}%"></i></div>
          <div class="rows"><div class="row"><span>${S("Pagas con", "Paid with")}</span><b>${S("Saldo Félix", "Félix balance")}</b></div></div>
          ${c.type === "installment" ? acts(c, S("Pagar", "Pay")) : ""}</div>`;
      }
      case "loan_paid_off": {
        const cols = ["#2feee4", "#ffb84d", "#ff6b8b", "#7c8cff", "#13a06c"];
        const conf = Array.from({ length: 18 }, (_, i) => `<i style="left:${(i * 5.5 + 2)}%;background:${cols[i % 5]};animation-delay:${(i % 6) * 0.08}s"></i>`).join("");
        return `<div class="${cls} party"><div class="confetti">${conf}</div><div class="c-title">${S("Préstamo liquidado", "Loan paid off")}</div><div class="big">4/4</div><div class="sub">${S("Tu línea sube a", "Your line goes up to")} ${money(800)}</div></div>`;
      }
      case "recipient_saved": {
        const r = recOf(d.rid);
        return `<div class="${cls}">${head(S("Destinatario guardado", "Recipient saved"), S("Nuevo", "New"), "cyan")}${whoHTML(r)}</div>`;
      }
      case "payday":
        return `<div class="${cls}">${head(S("Día de pago", "Payday"))}<div class="who"><div class="ini">${I("cal", 18, 2)}</div><div><div class="nm">${esc(tr(state.payday))}</div><div class="ds">${S("Te recuerdo enviar ese día", "I'll remind you to send that day")}</div></div></div></div>`;
      case "open_account":
        return `<div class="${cls}">${head(S("Cuenta Félix", "Félix account"), S("Gratis", "Free"), "ok")}${dcardHTML("3307", false)}
          <div class="bullets">${[S("Sin costo mensual", "No monthly fee"), S("Tarjeta de débito Visa", "Visa debit card"), S("Envía hoy, paga después hasta $150", "Send now, pay later up to $150"), S("Tu dinero gana 4% anual", "Your money earns 4% APY")].map((x) => `<div>${I("check", 16, 2.6)}${x}</div>`).join("")}</div>
          ${acts(c, t("openAcc"), t("notNow"))}</div>`;
      case "account_opened":
        return `<div class="${cls}">${head(S("Cuenta abierta", "Account open"), S("Activa", "Active"), "ok")}${dcardHTML("3307", false)}<div class="rows"><div class="row"><span>${t("balance")}</span><b>${money(state.account.balance)}</b></div><div class="row"><span>${S("Paga después disponible", "Pay later available")}</span><b>${money(state.credit.limit - state.credit.used)}</b></div></div></div>`;
      case "human":
        return `<div class="${cls}">${head(S("Equipo Félix", "Félix team"), S("~2 min", "~2 min"))}<div class="who"><div class="ini" style="background:var(--ink);color:var(--screen)">L</div><div><div class="nm">Lucía</div><div class="ds">${S("Se está uniendo", "Joining")}<span class="typing"><i></i><i></i><i></i></span></div></div></div></div>`;
    }
    return "";
  }

  // ───────── Tamaño del teléfono ─────────
  function fit() {
    const wrap = $("#phone-wrap");
    if (window.innerWidth <= 760) { wrap.style.removeProperty("--s"); return; }
    const avail = window.innerHeight - $(".bar").offsetHeight - 24;
    wrap.style.setProperty("--s", Math.min(1, Math.max(0.6, avail / 844)).toFixed(3));
  }

  // ───────── Eventos ─────────
  document.addEventListener("click", (e) => {
    const say = e.target.closest("[data-say]");
    if (say) { userSays(say.dataset.say, "tap"); return; }
    const tst = e.target.closest("[data-toast]");
    if (tst) { toast(t(tst.dataset.toast)); return; }
    const seg = e.target.closest(".seg button");
    if (seg && !seg.disabled) {
      const id = seg.parentElement.id, v = seg.dataset.v;
      if (id === "seg-scenario") { prefs.scenario = v; resetSession(); }
      if (id === "seg-lang") { prefs.lang = v; resetSession(); }
      if (id === "seg-theme") { prefs.theme = v; render(); }
      if (id === "seg-engine") { prefs.engine = v; resetSession(); }
    }
  });
  $("#orb").addEventListener("click", onOrb);
  $("#reset").addEventListener("click", resetSession);
  $("#btn-kb").addEventListener("click", () => { prefs.kb = !prefs.kb; if (prefs.kb && status === "listening") { Voice.stopAll(); setStatus("idle"); setCaption(""); } render(); if (prefs.kb) $("#kb-input").focus(); });
  $("#btn-mute").addEventListener("click", () => { prefs.muted = !prefs.muted; EL.setMuted(prefs.muted); if (!isEL() && prefs.muted && status === "speaking") { Voice.stopSpeaking(); setStatus("idle"); } toast(t(prefs.muted ? "muteOn" : "muteOff")); render(); });
  $("#btn-hf").addEventListener("click", () => { prefs.handsFree = !prefs.handsFree; toast(t(prefs.handsFree ? "hfOn" : "hfOff")); render(); });
  $("#btn-human").addEventListener("click", () => userSays(S("Quiero hablar con una persona", "I want to talk to a person"), "tap"));
  $("#kb").addEventListener("submit", (e) => { e.preventDefault(); const v = $("#kb-input").value; $("#kb-input").value = ""; userSays(v, "kb"); });
  document.addEventListener("keydown", (e) => { if (e.code === "Space" && document.activeElement.tagName !== "INPUT") { e.preventDefault(); onOrb(); } });
  window.addEventListener("resize", fit);

  // Parámetros de URL: ?s=new|steady&lang=es|en&theme=dark
  const q = new URLSearchParams(location.search);
  if (q.get("s") === "new" || q.get("s") === "steady") prefs.scenario = q.get("s");
  if (q.get("lang") === "en") prefs.lang = "en";
  if (q.get("theme") === "dark") prefs.theme = "dark";
  if (q.get("code")) accessCode = q.get("code");
  if (q.get("engine") === "demo") prefs.engine = "demo";
  if (!Voice.canListen) prefs.kb = true;

  resetSession();
  fit();
  // ¿Está configurado ElevenLabs en el servidor? Si sí, es el motor por defecto.
  if (location.protocol.startsWith("http")) {
    fetch("/api/el-token?check=1").then((r) => (r.ok ? r.json() : { configured: false })).then((j) => {
      elReady = !!j.configured;
      if (elReady && q.get("engine") !== "demo") { prefs.engine = "eleven"; prefs.kb = false; }
      render(); setStatus(status);
    }).catch(() => { elReady = false; render(); });
  } else elReady = false;
  // Guion automático para pruebas: ?play=frase 1|frase 2
  const play = q.get("play") || window.__PLAY__;
  if (play) { prefs.muted = true; render(); play.split("|").forEach((p, i) => setTimeout(() => userSays(p, "kb"), 600 + i * 900)); }
  window.FelixApp = { userSays, get state() { return state; }, get msgs() { return msgs; } };
})();
