import { z } from "zod";
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";

const convertEpochToSGT = (epochMs: number): string => {
  const offsetMs = epochMs + 8 * 60 * 60 * 1000;
  const dt = new Date(offsetMs);
  const year = dt.getUTCFullYear();
  const month = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const day = String(dt.getUTCDate()).padStart(2, "0");
  const hours = String(dt.getUTCHours()).padStart(2, "0");
  const minutes = String(dt.getUTCMinutes()).padStart(2, "0");
  const seconds = String(dt.getUTCSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export function registerTaskTools(
  server: McpServer,
  getApiKey: () => string,
  callClickUpApi: (
    path: string,
    method: string,
    apiKey: string,
    body?: any
  ) => Promise<any>
) {
  // Prompt for getTasks tool: instruct using 13-digit Unix timestamps with default Asia/Singapore (SGT) timezone
  server.prompt(
    "getTasks",
    "When calling the getTasks tool, include any time-based filter parameters as 13-digit Unix timestamps (ms since epoch) in the user's timezone (default Asia/Singapore (SGT)). Only include date filters (including date_done_gt and date_done_lt) when explicitly requested by the user; do not infer or confuse date_done with date_closed. After the tool runs, include the full JSON result verbatim in your response; do not omit it.",
    { timezone: z.string().optional() },
    ({ timezone }) => {
      const tz = timezone ?? "Asia/Singapore (SGT)";
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Convert all date/time filter parameters to 13-digit Unix timestamps (ms since epoch) in timezone ${tz} when calling getTasks. Only include date filters (including date_done_gt and date_done_lt) when explicitly requested by the user; do not infer or confuse date_done with date_closed.`,
            },
          },
        ],
      };
    }
  );

  // Resource: fetch a single task's metadata
  server.resource(
    "clickup_list_tasks",
    new ResourceTemplate("clickup://list/{list_id}/tasks", { list: undefined }),
    {
      description: "Fetch tasks/subtasks for a specific list",
      mimeType: "application/json",
    },
    async (uri, { list_id }) => {
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
        `list/${list_id}/task`,
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
    "getTasks",
    "Retrieve tasks/subtasks for a ClickUp list. When using time-based filters (e.g. due_date_gt, date_created_lt), supply 13-digit Unix timestamps (ms since epoch) in the user's timezone (default Asia/Singapore (SGT)). Only include date filters (including date_done_gt and date_done_lt) when explicitly requested by the user; do not infer or confuse date_done with date_closed. After execution, include the full JSON result in your response and do not omit or summarize it.",
    {
      list_id: z.number(),
      archived: z.boolean().optional(),
      include_markdown_description: z.boolean().optional(),
      page: z.number().optional(),
      order_by: z.string().optional(),
      reverse: z.boolean().optional(),
      subtasks: z.boolean().optional(),
      statuses: z.array(z.string()).optional(),
      include_closed: z.boolean().optional(),
      assignees: z.array(z.string()).optional(),
      watchers: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      due_date_gt: z.number().optional(),
      due_date_lt: z.number().optional(),
      date_created_gt: z.number().optional(),
      date_created_lt: z.number().optional(),
      date_updated_gt: z.number().optional(),
      date_updated_lt: z.number().optional(),
      date_done_gt: z.number().optional(),
      date_done_lt: z.number().optional(),
      custom_fields: z.array(z.string()).optional(),
      custom_field: z.array(z.string()).optional(),
      custom_items: z.array(z.number()).optional(),
    },
    async ({ list_id, ...params }) => {
      const apiKey = getApiKey();
      if (!apiKey)
        return { content: [{ type: "text", text: "API key missing." }] };
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (Array.isArray(v)) v.forEach((x) => query.append(k, String(x)));
        else if (v !== undefined) query.append(k, String(v));
      });
      const qstr = query.toString() ? `?${query.toString()}` : "";

      console.log(`list/${list_id}/task${qstr}`);

      const result = await callClickUpApi(
        `list/${list_id}/task${qstr}`,
        "GET",
        apiKey
      );

      return {
        content: [{ type: "text", text: JSON.stringify(result ?? []) }],
      };
    }
  );

  server.tool(
    "createTask",
    "Create a new task in the specified list",
    {
      list_id: z.string(),
      name: z.string(),
      description: z.string().optional(),
      status: z.string().optional(),
      priority: z.number().optional(),
      due_date: z.number().optional(),
      assignees: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
    },
    async ({ list_id, ...taskData }) => {
      const apiKey = getApiKey();
      if (!apiKey)
        return { content: [{ type: "text", text: "API key missing." }] };
      const result = await callClickUpApi(
        `list/${list_id}/task`,
        "POST",
        apiKey,
        taskData
      );
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "getTask",
    "Fetch metadata for a specific task",
    { task_id: z.string() },
    async ({ task_id }) => {
      const apiKey = getApiKey();
      if (!apiKey)
        return { content: [{ type: "text", text: "API key missing." }] };
      const result = await callClickUpApi(`task/${task_id}`, "GET", apiKey);
      const dateFields = [
        "date_created",
        "date_updated",
        "due_date",
        "date_closed",
        "start_date",
      ];
      const convertedTask: any = { ...result };
      dateFields.forEach((field) => {
        if (result[field]) {
          convertedTask[`${field}_sgt`] = convertEpochToSGT(result[field]);
        }
      });
      return {
        content: [{ type: "text", text: JSON.stringify(convertedTask) }],
      };
    }
  );

  server.tool(
    "updateTask",
    "Update properties of a specific task",
    {
      task_id: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      status: z.string().optional(),
      priority: z.number().optional(),
      due_date: z.number().optional(),
    },
    async ({ task_id, ...taskData }) => {
      const apiKey = getApiKey();
      if (!apiKey)
        return { content: [{ type: "text", text: "API key missing." }] };
      const result = await callClickUpApi(
        `task/${task_id}`,
        "PUT",
        apiKey,
        taskData
      );
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "deleteTask",
    "Delete a specific task",
    { task_id: z.string() },
    async ({ task_id }) => {
      const apiKey = getApiKey();
      if (!apiKey)
        return { content: [{ type: "text", text: "API key missing." }] };
      const result = await callClickUpApi(`task/${task_id}`, "DELETE", apiKey);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.resource(
    "clickup_task",
    new ResourceTemplate("clickup://task/{task_id}", { list: undefined }),
    {
      description: "Fetch metadata for a specific task",
      mimeType: "application/json",
    },
    async (uri, { task_id }) => {
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
      const result = await callClickUpApi(`task/${task_id}`, "GET", apiKey);
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
    "getWeekTasks",
    "Retrieve tasks for a specified ClickUp list that closed within a specific date range and are assigned to a given user. Parameters list_id must be a string, start_date and end_date must be raw date eg. 5 May 2025, and assignee must be a string (case-insensitive substring match). All parameters are required; the tool returns an error if any are missing.",
    {
      list_id: z.string(),
      start_date: z.string(),
      end_date: z.string(),
      assignee_username: z.string(),
    },
    async ({ list_id, start_date, end_date, assignee_username }) => {
      const apiKey = getApiKey();
      if (!apiKey) {
        return { content: [{ type: "text", text: "API key missing." }] };
      }
      const LIST_ID = list_id;
      const BASE_PATH = `list/${LIST_ID}/task`;
      let allTasks: any[] = [];

      const query = new URLSearchParams({
        archived: "false",
        subtasks: "true",
        include_closed: "true",
      });

      const path = `${BASE_PATH}?${query.toString()}`;
      const res: any = await callClickUpApi(path, "GET", apiKey);

      if (res.error || !Array.isArray(res.tasks)) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching tasks: ${
                res.error?.message || JSON.stringify(res.error || res)
              }`,
            },
          ],
        };
      }

      // Convert provided dates to 13-digit Unix timestamps at start/end of day in SGT timezone
      const offsetMs = 8 * 60 * 60 * 1000;
      const startTs =
        Date.UTC(
          new Date(start_date).getFullYear(),
          new Date(start_date).getMonth(),
          new Date(start_date).getDate(),
          0,
          0,
          0
        ) - offsetMs;
      const endTs =
        Date.UTC(
          new Date(end_date).getFullYear(),
          new Date(end_date).getMonth(),
          new Date(end_date).getDate(),
          23,
          59,
          59,
          999
        ) - offsetMs;

      // Paginate through pages and collect tasks within range
      let page = 0;
      let collectedTasks: any[] = [];
      while (true) {
        console.log("page", page);
        const pageQuery = new URLSearchParams({
          archived: "false",
          subtasks: "true",
          include_closed: "true",
          page: String(page),
        });
        const pagePath = `${BASE_PATH}?${pageQuery.toString()}`;
        const pageRes: any = await callClickUpApi(pagePath, "GET", apiKey);
        if (pageRes.error || !Array.isArray(pageRes.tasks)) {
          return {
            content: [
              {
                type: "text",
                text: `Error fetching tasks: ${
                  pageRes.error?.message ||
                  JSON.stringify(pageRes.error || pageRes)
                }`,
              },
            ],
          };
        }

        const pageFiltered = pageRes.tasks.filter((task: any) => {
          const ts =
            typeof task.date_closed === "number"
              ? task.date_closed
              : parseInt(task.date_closed as string);
          return (
            !isNaN(ts) &&
            ts >= startTs &&
            ts <= endTs &&
            (task.assignees[0]?.username ?? "")
              .toLowerCase()
              .includes(assignee_username.toLowerCase())
          );
        });
        // Stop if no matches on this page or no further pages available
        if (pageFiltered.length === 0 || pageRes.last_page === true) break;
        collectedTasks.push(...pageFiltered);
        page++;
      }

      const filteredAndFormatted = collectedTasks.map((task: any) => {
        const ts =
          typeof task.date_closed === "number"
            ? task.date_closed
            : parseInt(task.date_closed as string);
        const d = new Date(ts);
        const converted_date = d.toLocaleString("en-SG", {
          timeZone: "Asia/Singapore",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        const assigneeUsername = task.assignees[0]?.username;
        return {
          id: task.id,
          name: task.name,
          date_closed: converted_date,
          assignee: assigneeUsername,
          status: task.status.status,
          parent_task_id: task.parent,
        };
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(filteredAndFormatted),
          },
        ],
      };
    }
  );
}
