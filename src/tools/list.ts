import { z } from "zod";
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerListTools(
  server: McpServer,
  getApiKey: () => string,
  callClickUpApi: (
    path: string,
    method: string,
    apiKey: string,
    body?: any
  ) => Promise<any>
) {
  server.tool("getLists", { folder_id: z.string() }, async ({ folder_id }) => {
    const apiKey = getApiKey();
    if (!apiKey)
      return { content: [{ type: "text", text: "API key missing." }] };
    const result = await callClickUpApi(
      `folder/${folder_id}/list`,
      "GET",
      apiKey
    );
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  });

  server.tool(
    "createList",
    {
      folder_id: z.string(),
      name: z.string(),
      content: z.string().optional(),
    },
    async ({ folder_id, name, content: listContent }) => {
      const apiKey = getApiKey();
      if (!apiKey)
        return { content: [{ type: "text", text: "API key missing." }] };
      const result = await callClickUpApi(
        `folder/${folder_id}/list`,
        "POST",
        apiKey,
        { name, content: listContent }
      );
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "getFolderlessList",
    { space_id: z.string() },
    async ({ space_id }) => {
      const apiKey = getApiKey();
      if (!apiKey)
        return { content: [{ type: "text", text: "API key missing." }] };
      const result = await callClickUpApi(
        `space/${space_id}/list`,
        "GET",
        apiKey
      );
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool("getList", { list_id: z.string() }, async ({ list_id }) => {
    const apiKey = getApiKey();
    if (!apiKey)
      return { content: [{ type: "text", text: "API key missing." }] };
    const result = await callClickUpApi(`list/${list_id}`, "GET", apiKey);
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  });

  server.tool(
    "updateList",
    {
      list_id: z.string(),
      name: z.string().optional(),
      content: z.string().optional(),
      due_date: z.number().optional(),
      due_date_time: z.boolean().optional(),
      priority: z.number().optional(),
      assignee: z.string().optional(),
      status: z.string().optional(),
      unset_status: z.boolean().optional(),
    },
    async ({
      list_id,
      name,
      content,
      due_date,
      due_date_time,
      priority,
      assignee,
      status,
      unset_status,
    }) => {
      const apiKey = getApiKey();
      if (!apiKey)
        return { content: [{ type: "text", text: "API key missing." }] };
      const body: any = {};
      if (name !== undefined) body.name = name;
      if (content !== undefined) body.content = content;
      if (due_date !== undefined) body.due_date = due_date;
      if (due_date_time !== undefined) body.due_date_time = due_date_time;
      if (priority !== undefined) body.priority = priority;
      if (assignee !== undefined) body.assignee = assignee;
      if (status !== undefined) body.status = status;
      if (unset_status !== undefined) body.unset_status = unset_status;
      const result = await callClickUpApi(
        `list/${list_id}`,
        "PUT",
        apiKey,
        body
      );
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool("deleteList", { list_id: z.string() }, async ({ list_id }) => {
    const apiKey = getApiKey();
    if (!apiKey)
      return { content: [{ type: "text", text: "API key missing." }] };
    const result = await callClickUpApi(`list/${list_id}`, "DELETE", apiKey);
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  });

  // Resource: fetch a list's metadata
  server.resource(
    "clickup_list",
    new ResourceTemplate("clickup://list/{list_id}", { list: undefined }),
    async (uri, { list_id }) => {
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
      const result = await callClickUpApi(`list/${list_id}`, "GET", apiKey);
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

  // Resource: fetch all lists in a folder
  server.resource(
    "clickup_folder_lists",
    new ResourceTemplate("clickup://folder/{folder_id}/lists", {
      list: undefined,
    }),
    async (uri, { folder_id }) => {
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
      const result = await callClickUpApi(
        `folder/${folder_id}/list`,
        "GET",
        apiKey
      );
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

  // Resource: fetch all folderless lists in a space
  server.resource(
    "clickup_space_lists",
    new ResourceTemplate("clickup://space/{space_id}/lists", {
      list: undefined,
    }),
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
      const result = await callClickUpApi(
        `space/${space_id}/list`,
        "GET",
        apiKey
      );
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
}
