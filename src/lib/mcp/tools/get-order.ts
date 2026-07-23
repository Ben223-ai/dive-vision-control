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
  name: "get_order",
  title: "Get order",
  description:
    "Fetch a single order (with its items and tracking events) by order id or order number.",
  inputSchema: {
    id: z.string().optional().describe("Order UUID."),
    order_number: z.string().optional().describe("Human-readable order number."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, order_number }) => {
    if (!id && !order_number) {
      return {
        content: [{ type: "text", text: "Provide either id or order_number." }],
        isError: true,
      };
    }
    const supabase = anonClient();
    let query = supabase
      .from("orders")
      .select("*, order_items(*), order_tracking_events(*)")
      .limit(1);
    query = id ? query.eq("id", id) : query.eq("order_number", order_number!);
    const { data, error } = await query.maybeSingle();
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    if (!data) {
      return { content: [{ type: "text", text: "Order not found." }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { order: data },
    };
  },
});