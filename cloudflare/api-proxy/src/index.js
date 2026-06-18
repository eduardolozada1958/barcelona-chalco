/**
 * Proxy WAF delante de Render — Cloudflare Worker
 *
 * Despliegue:
 *   cd cloudflare/api-proxy
 *   npx wrangler secret put RENDER_ORIGIN   # https://barcelona-chalco-84n2.onrender.com
 *   npx wrangler deploy
 *
 * DNS: api.tudominio.com → Worker (ruta custom) o CNAME proxied al worker.
 */

const BLOCKED_PATH = /(\.\.|%2e%2e|<script|union\s+select|;\s*drop\s+table)/i;

export default {
  /**
   * @param {Request} request
   * @param {{ RENDER_ORIGIN: string }} env
   */
  async fetch(request, env) {
    const url = new URL(request.url);

    if (BLOCKED_PATH.test(url.pathname + url.search)) {
      return new Response(JSON.stringify({ success: false, message: 'Solicitud bloqueada' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const origin = (env.RENDER_ORIGIN || 'https://barcelona-chalco-84n2.onrender.com').replace(/\/$/, '');
    const target = `${origin}${url.pathname}${url.search}`;

    const headers = new Headers(request.headers);
    headers.set('X-Forwarded-For', request.headers.get('CF-Connecting-IP') || '');
    headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));
    headers.delete('host');

    const init = {
      method:  request.method,
      headers,
      body:    request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
      redirect: 'manual',
    };

    const response = await fetch(target, init);
    const out = new Response(response.body, response);
    out.headers.set('X-Content-Type-Options', 'nosniff');
    out.headers.set('X-Frame-Options', 'DENY');
    out.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return out;
  },
};
