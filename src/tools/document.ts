import { z } from "zod";
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerDocTools(
  server: McpServer,
  getApiKey: () => string,
  callClickUpApi: (
    path: string,
    method: string,
    apiKey: string,
    body?: any
  ) => Promise<any>
) {
  // Resource: list docs in a workspace
  server.resource(
    "clickup_docs",
    new ResourceTemplate("clickup://workspace/{workspace_id}/docs", {
      list: undefined,
    }),
    { description: "List docs in a workspace", mimeType: "application/json" },
    async (uri, { workspace_id }) => {
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
        `/v3/workspaces/${workspace_id}/docs`,
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

  // Resource: fetch a doc's metadata
  server.resource(
    "clickup_doc",
    new ResourceTemplate("clickup://workspace/{workspace_id}/doc/{doc_id}", {
      list: undefined,
    }),
    {
      description: "Fetch metadata for a specific document",
      mimeType: "application/json",
    },
    async (uri, { workspace_id, doc_id }) => {
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
        `/v3/workspaces/${workspace_id}/docs/${doc_id}`,
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

  // Resource: fetch pages of a doc
  server.resource(
    "clickup_doc_pages",
    new ResourceTemplate(
      "clickup://workspace/{workspace_id}/doc/{doc_id}/pages",
      { list: undefined }
    ),
    {
      description: "Fetch pages of a specific document",
      mimeType: "application/json",
    },
    async (uri, { workspace_id, doc_id }) => {
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
      const qs = new URLSearchParams();
      qs.set("max_page_depth", "-1");
      qs.set("content_format", "text/md");
      const qstr = qs.toString() ? `?${qs.toString()}` : "";
      const result = await callClickUpApi(
        `/v3/workspaces/${workspace_id}/docs/${doc_id}/pages${qstr}`,
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

  server.tool(
    "searchDocs",
    "Search documents in a workspace with optional filters",
    {
      workspace_id: z.number(),
      id: z.string().optional(),
      creator: z.number().optional(),
      deleted: z.boolean().optional(),
      archived: z.boolean().optional(),
      parent_id: z.string().optional(),
      parent_type: z.string().optional(),
      limit: z.number().optional(),
      next_cursor: z.string().optional(),
    },
    async ({
      workspace_id,
      id,
      creator,
      deleted,
      archived,
      parent_id,
      parent_type,
      limit,
      next_cursor,
    }) => {
      const apiKey = getApiKey();
      if (!apiKey)
        return { content: [{ type: "text", text: "API key missing." }] };
      const qs = new URLSearchParams();
      if (id) qs.set("id", id);
      if (creator !== undefined) qs.set("creator", String(creator));
      qs.set("deleted", String(deleted ?? false));
      qs.set("archived", String(archived ?? false));
      if (parent_id) qs.set("parent_id", parent_id);
      if (parent_type) qs.set("parent_type", parent_type);
      qs.set("limit", String(limit ?? 50));
      if (next_cursor) qs.set("next_cursor", next_cursor);
      const qstr = qs.toString() ? `?${qs.toString()}` : "";
      const result = await callClickUpApi(
        `/v3/workspaces/${workspace_id}/docs${qstr}`,
        "GET",
        apiKey
      );
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "createDoc",
    "Create a new document in a workspace",
    {
      workspace_id: z.string(),
      title: z.string(),
      content: z.string().optional(),
      parent_doc: z.string().optional(),
    },
    async ({ workspace_id, title, content: bodyContent, parent_doc }) => {
      const apiKey = getApiKey();
      if (!apiKey)
        return { content: [{ type: "text", text: "API key missing." }] };
      const docData: any = { title };
      if (bodyContent) docData.content = bodyContent;
      if (parent_doc) docData.parent_doc = parent_doc;
      const result = await callClickUpApi(
        `team/${workspace_id}/doc`,
        "POST",
        apiKey,
        docData
      );
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "getDoc",
    "Fetch metadata for a specific document",
    { workspace_id: z.number(), doc_id: z.string() },
    async ({ workspace_id, doc_id }) => {
      const apiKey = getApiKey();
      if (!apiKey)
        return { content: [{ type: "text", text: "API key missing." }] };
      const result = await callClickUpApi(
        `/v3/workspaces/${workspace_id}/docs/${doc_id}`,
        "GET",
        apiKey
      );
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "getDocPages",
    "Fetch pages of a specific document with formatting options",
    {
      workspace_id: z.number(),
      doc_id: z.string(),
      max_page_depth: z.number().optional(),
      content_format: z.string().optional(),
    },
    async ({ workspace_id, doc_id, max_page_depth, content_format }) => {
      const apiKey = getApiKey();
      if (!apiKey)
        return { content: [{ type: "text", text: "API key missing." }] };
      const qs = new URLSearchParams();
      qs.set("max_page_depth", String(max_page_depth ?? -1));
      qs.set("content_format", content_format ?? "text/md");
      const qstr = qs.toString() ? `?${qs.toString()}` : "";
      const result = await callClickUpApi(
        `/v3/workspaces/${workspace_id}/docs/${doc_id}/pages${qstr}`,
        "GET",
        apiKey
      );
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );
}
