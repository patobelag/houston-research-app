# Félix Conversacional

Prototipo voice first de Félix. Hablas con Félix y la app aparece dentro de la conversación.

## Estado

Fase 1: shell, datos de prueba, tarjetas, cerebro demo y voz del navegador.
Fase 2: agente de ElevenLabs (voz bODdtoNp555Uj9jANhzI) con las mismas tools. Se activa solo cuando Vercel tiene las variables.

## Activar ElevenLabs (una vez)

Variables en Vercel (Settings, Environment Variables):

- `ELEVENLABS_API_KEY`: tu API key de ElevenLabs. Solo vive en Vercel.
- `SETUP_SECRET`: una palabra secreta inventada por ti, para crear el agente.
- `ACCESS_CODE` (recomendado): código para testers. El link queda `https://tu-app.vercel.app/?code=CODIGO`. Evita que cualquiera gaste tus créditos.
- `ELEVENLABS_AGENT_ID`: lo obtienes en el paso 2.

Pasos:

1. Agrega `ELEVENLABS_API_KEY`, `SETUP_SECRET` y `ACCESS_CODE`. Haz Redeploy.
2. Abre `https://tu-app.vercel.app/api/setup-agent?secret=TU_SETUP_SECRET`. Copia el `agent_id` de la respuesta.
3. Agrega `ELEVENLABS_AGENT_ID` con ese valor. Haz Redeploy.
4. Abre la app. El selector de voz muestra ElevenLabs activo.

Para cambiar el prompt: edita `agent/config.js`, sube el cambio y vuelve a abrir `/api/setup-agent?secret=...`. Actualiza el agente existente.

Parámetros extra: `?engine=demo` fuerza la voz del navegador.

## Cómo probar local

1. `node build.js` genera `public/index.html`.
2. Abre `public/index.html` en Chrome o Safari. El micrófono pide https o localhost: usa `npx serve public` si el navegador no lo permite desde archivo.
3. `node test/brain.test.js` corre 32 pruebas de los flujos.

Parámetros de URL: `?s=new` (nuevo usuario), `?s=steady`, `?lang=en`, `?theme=dark`.

## Deploy en Vercel

1. Sube esta carpeta a un repo de GitHub.
2. En Vercel: Add New Project, elige el repo. `vercel.json` ya define build y salida.

## Estructura

- `src/core.js`: datos de prueba, tools y cerebro demo. Sin DOM.
- `src/app.js`: interfaz, tarjetas y voz del navegador.
- `src/styles.css`, `src/index.src.html`: estilos y plantilla.
- `test/brain.test.js`: pruebas de flujos.

## Tools (contrato compartido con ElevenLabs)

show_balance, show_rates, show_card, set_card_frozen, show_movements, list_recipients,
prepare_transfer, offer_pay_later, offer_loan, prepare_installment_payment,
save_recipient, save_payday, prepare_open_account, talk_to_human,
confirm_pending, cancel_pending.

Toda acción con dinero queda pendiente hasta que el usuario confirma.

## Valores de prueba (editar en `CONFIG` de `src/core.js`)

- Comisión de envío: $2.99
- Tipo de cambio: MXN 18.78, COP 3,172, GTQ 7.64, HNL 26.87
- Paga después: 4 pagos quincenales, sin intereses, cargo fijo $4.99
- Crédito: 5% mensual sobre el monto, 3 meses, pagos quincenales, mínimo $50
- Límite: $500 usuario actual, $150 usuario nuevo

Estos números son supuestos del prototipo. Valídalos con Producto y Riesgo antes de testear con usuarios.
