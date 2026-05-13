// Cloudflare Worker: proxy con cache KV para la lectura de proyectos.
// Recibe GET → devuelve datos de KV (cache hit) o fetcha Power Automate (cache miss).
// Cron cada 4 min → mantiene el cache caliente para que ningún usuario espere.
// X-Invalidate header → borra el cache tras una escritura desde el frontend.

const CACHE_KEY = "portfolio-data";
const CACHE_TTL = 300; // 5 minutos

// URL del flujo de lectura de Power Automate (solo lectura, sin datos sensibles de usuario)
const PA_URL =
  "https://default510f9de096154a978ffa0354dd6cd6.c7.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/cb308f7c39e64f98abd933ffe0635ab8/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=PNInfVa9dTDZpAn3R1jKn4r4W24-AlZRgLzSr4sp13Y";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Invalidate",
};

async function fetchFromPA() {
  const res = await fetch(PA_URL, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return res;
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Invalidación de cache: llamado por el frontend tras cada escritura
    const invalidateSecret = env.INVALIDATE_SECRET;
    if (invalidateSecret && request.headers.get("X-Invalidate") === invalidateSecret) {
      await env.CACHE.delete(CACHE_KEY);
      return new Response("ok", { headers: CORS_HEADERS });
    }

    // Intentar servir desde KV cache
    const cached = await env.CACHE.get(CACHE_KEY);
    if (cached) {
      return new Response(cached, {
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/json",
          "X-Cache": "HIT",
        },
      });
    }

    // Cache miss: llamar a Power Automate y guardar resultado
    const upstream = await fetchFromPA();
    const body = await upstream.text();

    if (upstream.ok) {
      // Guardar en KV (fire-and-forget, no bloquea la respuesta)
      env.CACHE.put(CACHE_KEY, body, { expirationTtl: CACHE_TTL });
    }

    return new Response(body, {
      status: upstream.status,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
        "X-Cache": "MISS",
      },
    });
  },

  // Cron trigger: calienta el cache cada 4 minutos para que ningún usuario
  // experimente la latencia de Power Automate (~2-5s) directamente.
  async scheduled(_event, env) {
    const upstream = await fetchFromPA();
    if (upstream.ok) {
      const body = await upstream.text();
      await env.CACHE.put(CACHE_KEY, body, { expirationTtl: CACHE_TTL });
    }
  },
};
