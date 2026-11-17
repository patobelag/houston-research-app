// Routing Middleware de Vercel: contraseña para entrar a /chat-voz.
// La contraseña vive solo en Vercel (CHAT_VOZ_PASSWORD). Este repo es público:
// nunca pongas aquí la contraseña ni nada derivado de ella.
// Al entrar se guarda una cookie firmada con la contraseña (HMAC); si cambias la
// contraseña en Vercel, todas las sesiones anteriores dejan de servir.

export const config = {
  matcher: ["/chat-voz", "/chat-voz/:path*", "/api/stt"],
};

const COOKIE = "cv_auth";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 días

// Equivale a next() de @vercel/functions: deja pasar la petición
const pass = () => new Response(null, { headers: { "x-middleware-next": "1" } });

async function tokenFor(password) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode("chat-voz:v1"));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Comparación en tiempo constante
function same(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

function readCookie(request, name) {
  const raw = request.headers.get("cookie") || "";
  for (const part of raw.split(/;\s*/)) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i) === name) return decodeURIComponent(part.slice(i + 1));
  }
  return null;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function loginPage(action, error, status) {
  const html = `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#082422">
<title>Félix · Entrar</title>
<style>
:root{--bg:#082422;--card:#0d3a37;--ink:#fff;--mut:#9fd3d1;--acc:#2bf2f1;--line:rgba(255,255,255,.16);--err:#ff8a7a}
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
body{background:linear-gradient(180deg,#082422 0%,#0d3a37 100%);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;display:grid;place-items:center;padding:24px 16px}
main{width:100%;max-width:360px;text-align:center}
.logo{width:72px;height:72px;border-radius:50%;background:var(--acc);display:grid;place-items:center;margin:0 auto 20px}
h1{font-size:26px;font-weight:600;letter-spacing:-.02em;margin-bottom:6px}
p{color:var(--mut);font-size:15.5px;line-height:1.4;margin-bottom:24px}
form{display:flex;flex-direction:column;gap:12px;text-align:left}
label{font-size:13.5px;color:var(--mut)}
input{width:100%;height:52px;border-radius:14px;border:1px solid var(--line);background:rgba(255,255,255,.08);color:#fff;font-size:17px;padding:0 16px;outline:none}
input:focus{border-color:var(--acc)}
button{height:52px;border-radius:999px;border:0;background:var(--acc);color:#082422;font-size:17px;font-weight:600;cursor:pointer;margin-top:4px}
button:active{transform:scale(.99)}
.err{color:var(--err);font-size:14.5px;min-height:20px}
</style></head>
<body><main>
<div class="logo" aria-hidden="true"><svg width="38" height="38" viewBox="0 0 78 78" fill="none"><path d="M33.5925 33.7539L34.0941 33.7718L35.2255 19.3908H67.8167L70 0L12.159 0.0089C12.159 0.0089 10.9833 5.2817 10.6916 8.8519C9.4784 23.7432 18.9455 33.3194 33.5925 33.7539Z" fill="#082422"/><path d="M8.5436 66.3758L8 78H31.0644L32.9229 54.7137L50.9023 54.8006L53.205 34.5339H44.16C25.427 34.5339 9.2066 46.3587 8.5414 66.378Z" fill="#082422"/></svg></div>
<h1>Chat con Félix</h1>
<p>Este prototipo es privado. Escribe la contraseña para entrar.</p>
<form method="POST" action="${esc(action)}">
<label for="pw">Contraseña</label>
<input id="pw" name="password" type="password" autocomplete="current-password" required autofocus>
<div class="err" role="alert">${error ? esc(error) : ""}</div>
<button type="submit">Entrar</button>
</form>
</main></body></html>`;
  return new Response(html, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" },
  });
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const password = process.env.CHAT_VOZ_PASSWORD;
  const isApi = url.pathname.startsWith("/api/");

  // Sin contraseña configurada, no se abre (falla cerrado)
  if (!password) {
    return isApi
      ? Response.json({ error: "not_configured" }, { status: 503 })
      : new Response("El acceso a este prototipo no está configurado.", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } });
  }

  const expected = await tokenFor(password);
  if (same(readCookie(request, COOKIE), expected)) return pass();

  if (isApi) return Response.json({ error: "login_required" }, { status: 401 });

  const action = url.pathname + url.search;

  // Envío del formulario
  if (request.method === "POST") {
    let given = "";
    try { given = String((await request.formData()).get("password") || ""); } catch (e) {}
    if (same(await tokenFor(given), expected)) {
      return new Response(null, {
        status: 303,
        headers: {
          Location: action,
          "Set-Cookie": `${COOKIE}=${expected}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
          "cache-control": "no-store",
        },
      });
    }
    return loginPage(action, "Contraseña incorrecta. Intenta de nuevo.", 401);
  }

  return loginPage(action, "", 401);
}
