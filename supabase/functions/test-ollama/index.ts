import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { host, port } = await req.json();
    const targetHost = host || "localhost";
    const targetPort = port || 11434;
    const url = `http://${targetHost}:${targetPort}/api/tags`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `Ollama respondio HTTP ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const modelCount = data.models?.length ?? 0;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Conexion exitosa a ${targetHost}:${targetPort}. ${modelCount} modelo(s) disponible(s).`,
        models: data.models?.map((m: { name: string }) => m.name) ?? [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return new Response(
      JSON.stringify({ success: false, error: `No se pudo conectar: ${message}` }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
