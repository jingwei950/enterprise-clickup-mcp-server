import { z } from "zod";
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerSpaceTools(
  server: McpServer,
  getApiKey: () => string,
  callClickUpApi: (
    path: string,
    method: string,
    apiKey: string,
    body?: any
  ) => Promise<any>
) {
  // Resource: fetch a space's metadata
  server.resource(
    "clickup_space",
    new ResourceTemplate("clickup://space/{space_id}", { list: undefined }),
    {
      description: "Fetch metadata for a specific space",
      mimeType: "application/json",
    },
    async (uri, { space_id }) => {
      const apiKey = getApiKey();
      if (!apiKey)
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: JSON.stringify({ error: "API key missing." }),
            },
          ],
        };
      const result = await callClickUpApi(`space/${space_id}`, "GET", apiKey);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(result),
          },
        ],
      };
    }
  );

  server.tool(
    "getSpaces",
    "Fetch all spaces in a workspace",
    { team_id: z.number(), archived: z.boolean().optional() },
    async ({ team_id, archived }) => {
      const apiKey = getApiKey();
      if (!apiKey)
        return { content: [{ type: "text", text: "API key missing." }] };
      const query = archived !== undefined ? `?archived=${archived}` : "";
      const result = await callClickUpApi(
        `team/${team_id}/space${query}`,
        "GET",
        apiKey
      );
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "createSpace",
    "Create a new space in the specified workspace with given features",
    {
      workspace_id: z.string(),
      name: z.string(),
      multiple_assignees: z.boolean(),
      features: z.object({
        due_dates: z.object({ enabled: z.boolean() }),
        time_tracking: z.object({ enabled: z.boolean() }),
        tags: z.object({ enabled: z.boolean() }),
        time_estimates: z.object({ enabled: z.boolean() }),
        checklists: z.object({ enabled: z.boolean() }),
        custom_fields: z.object({ enabled: z.boolean() }),
        remap_dependencies: z.object({ enabled: z.boolean() }),
        dependency_warning: z.object({ enabled: z.boolean() }),
        portfolios: z.object({ enabled: z.boolean() }),
      }),
    },
    async ({ workspace_id, name, multiple_assignees, features }) => {
      const apiKey = getApiKey();
      if (!apiKey)
        return { content: [{ type: "text", text: "API key missing." }] };
      const payload = {
        name,
        multiple_assignees: multiple_assignees,
        features: {
          due_dates: features.due_dates,
          time_tracking: features.time_tracking,
          tags: features.tags,
          time_estimates: features.time_estimates,
          checklists: features.checklists,
          custom_fields: features.custom_fields,
          remap_dependencies: features.remap_dependencies,
          dependency_warning: features.dependency_warning,
          portfolios: features.portfolios,
        },
      };
      const result = await callClickUpApi(
        `team/${workspace_id}/space`,
        "POST",
        apiKey,
        payload
      );
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "getSpace",
    "Fetch metadata for a specific space",
    { space_id: z.string() },
    async ({ space_id }) => {
      const apiKey = getApiKey();
      if (!apiKey)
        return { content: [{ type: "text", text: "API key missing." }] };
      const result = await callClickUpApi(`space/${space_id}`, "GET", apiKey);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "updateSpace",
    "Update properties of a specific space",
    {
      space_id: z.string(),
      name: z.string(),
      color: z.string().optional(),
      is_private: z.boolean(),
      admin_can_manage: z.boolean().optional(),
      multiple_assignees: z.boolean().optional(),
      features: z.object({
        due_dates: z.object({ enabled: z.boolean() }),
        time_tracking: z.object({ enabled: z.boolean() }),
        tags: z.object({ enabled: z.boolean() }),
        time_estimates: z.object({ enabled: z.boolean() }),
        checklists: z.object({ enabled: z.boolean() }),
        custom_fields: z.object({ enabled: z.boolean() }),
        remap_dependencies: z.object({ enabled: z.boolean() }),
        dependency_warning: z.object({ enabled: z.boolean() }),
        portfolios: z.object({ enabled: z.boolean() }),
      }),
    },
    async ({
      space_id,
      name,
      color,
      is_private,
      admin_can_manage,
      multiple_assignees,
      features,
    }) => {
      const apiKey = getApiKey();
      if (!apiKey)
        return { content: [{ type: "text", text: "API key missing." }] };
      const payload = {
        name,
        color: color || "#7B68EE",
        private: is_private,
        admin_can_manage,
        multiple_assignees,
        features: {
          due_dates: features.due_dates,
          time_tracking: features.time_tracking,
          tags: features.tags,
          time_estimates: features.time_estimates,
          checklists: features.checklists,
          custom_fields: features.custom_fields,
          remap_dependencies: features.remap_dependencies,
          dependency_warning: features.dependency_warning,
          portfolios: features.portfolios,
        },
      };
      const result = await callClickUpApi(
        `space/${space_id}`,
        "PUT",
        apiKey,
        payload
      );
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "deleteSpace",
    "Delete a specific space",
    { space_id: z.string() },
    async ({ space_id }) => {
      const apiKey = getApiKey();
      if (!apiKey)
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ error: "API key missing." }),
            },
          ],
        };
      const result = await callClickUpApi(
        `space/${space_id}`,
        "DELETE",
        apiKey
      );
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );
}
