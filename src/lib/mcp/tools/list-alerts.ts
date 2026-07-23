import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

function anonClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export default defineTool({
  name: "list_alerts",
  title: "List alerts",
  description: "List recent logistics alerts, optionally filtered by severity or status.",
  inputSchema: {
    severity: z.string().optional().describe("Filter by severity, e.g. low, medium, high, critical."),
    status: z.string().optional().describe("Filter by status, e.g. active, resolved."),
    limit: z.number().int().min(1).max(100).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ severity, status, limit }) => {
    const supabase = anonClient();
    let query = supabase
      .from("alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (severity) query = query.eq("severity", severity);
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { alerts: data ?? [] },
    };
  },
});