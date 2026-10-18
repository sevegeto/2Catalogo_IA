import { createClient } from "npm:@supabase/supabase-js@2.58.0";

/**
 * Prueba de conectividad con un servidor Ollama (GET /api/tags).
 *
 * Seguridad:
 *  - Exige el JWT de un usuario con rol admin (se comprueba con has_role en la base).
 *  - Solo admite un nombre de host o IP y un puerto válidos; la ruta es fija.
 *  - Bloquea loopback, link-local y endpoints de metadatos de la nube.
 *  - No sigue redirecciones y corta a los 5 segundos.
 *
 * Nota: "localhost" aquí sería el servidor de Supabase, no tu equipo Fedora. Usa una
 * dirección alcanzable desde internet (túnel, Tailscale Funnel, DNS público, etc.).
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const HOSTNAME = /^(?=.{1,253}$)(?!-)[a-zA-Z0-9-]{1,63}(?<!-)(\.(?!-)[a-zA-Z0-9-]{1,63}(?<!-))*$/;
const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

function blockedHost(host: string): string | null {
  const h = host.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h === "metadata.google.internal") {
    return "Ese host apunta al propio servidor de Supabase. Usa una dirección pública de tu equipo.";
  }
  const ip = h.match(IPV4);
  if (ip) {
    const [a, b] = ip.slice(1, 3).map(Number);
    if (ip.slice(1).some((n) => Number(n) > 255)) return "Dirección IP inválida.";
    if (a === 127 || a === 0 || (a === 169 && b === 254)) {
      return "Direcciones loopback y link-local no permitidas.";
    }
  }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Método no permitido" }, 405);

  const authorization = req.headers.get("Authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return json({ success: false, error: "Inicia sesión" }, 401);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", { required: "admin" });
  if (roleError || isAdmin !== true) {
    return json({ success: false, error: "Solo un administrador puede probar el worker" }, 403);
  }

  let host = "";
  let port = 11434;
  try {
    const body = await req.json();
    host = String(body?.host ?? "").trim();
    port = Number(body?.port ?? 11434);
  } catch {
    return json({ success: false, error: "Solicitud inválida" }, 400);
  }
  if (!HOSTNAME.test(host) && !IPV4.test(host)) return json({ success: false, error: "Host inválido" }, 400);
  if (!Number.isInteger(port) || port < 1 || port > 65535) return json({ success: false, error: "Puerto inválido" }, 400);
  const blocked = blockedHost(host);
  if (blocked) return json({ success: false, error: blocked }, 400);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`http://${host}:${port}/api/tags`, { signal: controller.signal, redirect: "manual" });
    if (!response.ok) return json({ success: false, error: `Ollama respondió HTTP ${response.status}` }, 502);
    const data = await response.json();
    const models: string[] = Array.isArray(data?.models)
      ? data.models.slice(0, 50).map((m: { name?: unknown }) => String(m?.name ?? "")).filter(Boolean)
      : [];
    return json({
      success: true,
      message: `Conexión exitosa a ${host}:${port}. ${models.length} modelo(s) disponible(s).`,
      models,
    });
  } catch (err) {
    const message = err instanceof Error && err.name === "AbortError" ? "tiempo de espera agotado" : "no se pudo conectar";
    return json({ success: false, error: `Sin respuesta de ${host}:${port} (${message})` }, 502);
  } finally {
    clearTimeout(timeoutId);
  }
});
