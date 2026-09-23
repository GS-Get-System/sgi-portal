/**
 * Proxy Cloudflare Pages Function — sgi.getsystem.io/api → Worker gestion-contenido-api.
 *
 * Hace tres cosas y nada más: sirve `config` (público, pre-login), inyecta el secreto
 * compartido y la identidad de Cloudflare Access, y reenvía. Same-origin: sin CORS.
 *
 * Identidad: la pone Cloudflare Access delante de todo sgi.getsystem.io. El borde de
 * Cloudflare DESPOJA las cabeceras Cf-* al reenviar a otro servicio, así que el Worker
 * nunca vería `Cf-Access-Authenticated-User-Email`: la leemos acá y la mandamos en
 * `X-Access-Email`, y el Worker le cree porque viene con `X-Proxy-Key` (src/puerta.js).
 * Cualquier cfEmail que venga del navegador se ignora (anti-suplantación).
 *
 * Variables (Pages → Settings → Environment variables), NUNCA en el código:
 *   API_URL     URL del Worker
 *   PROXY_KEY   secreto compartido con el Worker (el mismo que `wrangler secret put PROXY_KEY`)
 */
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function b64urlToStr(s) {
  s = String(s).replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return atob(s);
}
function emailFromJwt(jwt) {
  try { const p = JSON.parse(b64urlToStr(String(jwt).split('.')[1])); return p.email || ''; } catch { return ''; }
}
export function getAccessEmail(request) {
  const direct = request.headers.get('Cf-Access-Authenticated-User-Email');
  if (direct) return direct;
  const assertion = request.headers.get('Cf-Access-Jwt-Assertion');
  if (assertion) return emailFromJwt(assertion);
  const m = (request.headers.get('Cookie') || '').match(/CF_Authorization=([^;]+)/);
  return m ? emailFromJwt(m[1]) : '';
}

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return json({ ok: false, error: 'Método no permitido.' }, 405);
  const payload = await request.json().catch(() => ({}));

  if (payload.action === 'config') return json({ ok: true, data: { motor: 'pages-proxy' } });
  if (!env.API_URL) return json({ ok: false, error: 'Proxy sin API_URL configurada.' }, 500);

  const email = getAccessEmail(request);
  delete payload.cfEmail;                        // lo arma el navegador: no se le cree

  const upstream = await fetch(env.API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Proxy-Key': env.PROXY_KEY || '',
      'X-Access-Email': email,
    },
    body: JSON.stringify(payload),
    redirect: 'follow',
  });
  return new Response(await upstream.text(), {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
