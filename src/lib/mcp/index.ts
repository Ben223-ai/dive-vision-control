import { defineMcp } from "@lovable.dev/mcp-js";
import listOrdersTool from "./tools/list-orders";
import getOrderTool from "./tools/get-order";
import listAlertsTool from "./tools/list-alerts";

export default defineMcp({
  name: "lp-control-tower-mcp",
  title: "LP Control Tower MCP",
  version: "0.1.0",
  instructions:
    "Read-only access to the LP Control Tower logistics platform. Use list_orders and get_order to inspect shipment orders and their items/tracking events, and list_alerts to review recent operational alerts.",
  tools: [listOrdersTool, getOrderTool, listAlertsTool],
});