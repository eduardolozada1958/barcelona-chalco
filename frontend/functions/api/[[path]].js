/**
 * Proxy /api/* → Worker WAF → Render (mismo origen pages.dev).
 */
const WORKER_ORIGIN = 'https://barcelona-api-proxy.eduardolozada1958.workers.dev';

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const target = `${WORKER_ORIGIN}${url.pathname}${url.search}`;

  const headers = new Headers(request.headers);
  headers.delete('host');

  const init = {
    method:  request.method,
    headers,
    body:    request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    redirect: 'manual',
  };

  return fetch(target, init);
}
