import { z } from "zod";
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerFolderTools(
  server: McpServer,
  getApiKey: () => string,
  callClickUpApi: (
    path: string,
    method: string,
    apiKey: string,
    body?: any
  ) => Promise<any>
) {
  // Resource clickup_folder: Fetch metadata for a specific folder
  server.resource(
    "clickup_folder",
    new ResourceTemplate("clickup://folder/{folder_id}", { list: undefined }),
    {
      description: "Fetch metadata for a specific folder",
      mimeType: "application/json",
    },
    async (uri, { folder_id }) => {
      const apiKey = getApiKey();
      if (!apiKey) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: JSON.stringify({ error: "API key missing." }),
            },
          ],
        };
      }
      const result = await callClickUpApi(`folder/${folder_id}`, "GET", apiKey);
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

  // Resource clickup_space_folders: Fetch all folders in the specified space
  server.resource(
    "clickup_space_folders",
    new ResourceTemplate("clickup://space/{space_id}/folders", {
      list: undefined,
    }),
    {
      description: "Fetch all folders in the specified space",
      mimeType: "application/json",
    },
    async (uri, { space_id }) => {
      const apiKey = getApiKey();
      if (!apiKey) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: JSON.stringify({ error: "API key missing." }),
            },
          ],
        };
      }
      const result = await callClickUpApi(
        `space/${space_id}/folder`,
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
    "getFolders",
    "Fetch all folders in the specified space",
    { space_id: z.string() },
    async ({ space_id }) => {
      const apiKey = getApiKey();
      if (!apiKey) {
        return { content: [{ type: "text", text: "API key missing." }] };
      }
      const result = await callClickUpApi(
        `space/${space_id}/folder`,
        "GET",
        apiKey
      );
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "createFolder",
    "Create a new folder in the specified space with a given name",
    { space_id: z.string(), name: z.string() },
    async ({ space_id, name }) => {
      const apiKey = getApiKey();
      if (!apiKey) {
        return { content: [{ type: "text", text: "API key missing." }] };
      }
      const result = await callClickUpApi(
        `space/${space_id}/folder`,
        "POST",
        apiKey,
        { name }
      );
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "getFolder",
    "Fetch metadata for a specific folder",
    { folder_id: z.string() },
    async ({ folder_id }) => {
      const apiKey = getApiKey();
      if (!apiKey) {
        return { content: [{ type: "text", text: "API key missing." }] };
      }
      const result = await callClickUpApi(`folder/${folder_id}`, "GET", apiKey);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "updateFolder",
    "Update the name of a specific folder",
    { folder_id: z.string(), name: z.string() },
    async ({ folder_id, name }) => {
      const apiKey = getApiKey();
      if (!apiKey) {
        return { content: [{ type: "text", text: "API key missing." }] };
      }
      const result = await callClickUpApi(
        `folder/${folder_id}`,
        "PUT",
        apiKey,
        {
          name,
        }
      );
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "deleteFolder",
    "Delete a specific folder",
    { folder_id: z.string() },
    async ({ folder_id }) => {
      const apiKey = getApiKey();
      if (!apiKey) {
        return { content: [{ type: "text", text: "API key missing." }] };
      }
      const result = await callClickUpApi(
        `folder/${folder_id}`,
        "DELETE",
        apiKey
      );
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );
}
