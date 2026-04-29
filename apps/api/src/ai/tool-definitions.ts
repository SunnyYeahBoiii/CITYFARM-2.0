export const TOOL_DEFINITIONS = [
  {
    name: 'create_care_task',
    description:
      'Create a scheduled care task for a plant. Use this when the user asks to schedule or set up a care activity like watering, fertilizing, pruning, etc.',
    parameters: {
      type: 'object',
      properties: {
        plantId: {
          type: 'string',
          description: 'The ID of the garden plant to create the task for.',
        },
        taskType: {
          type: 'string',
          enum: [
            'WATERING',
            'FERTILIZING',
            'PRUNING',
            'ROTATING',
            'PEST_CHECK',
            'HARVEST',
            'CUSTOM',
          ],
          description: 'The type of care task to create.',
        },
        title: {
          type: 'string',
          description:
            'A short title for the task, e.g., "Tưới nước hàng tuần"',
        },
        dueAt: {
          type: 'string',
          format: 'date-time',
          description:
            'Optional due date/time for the task in ISO 8601 format. If not specified, defaults to today.',
        },
        notes: {
          type: 'string',
          description:
            'Optional additional notes or instructions for the task.',
        },
      },
      required: ['plantId', 'taskType', 'title'],
    },
  },
  {
    name: 'log_journal_entry',
    description:
      'Create a journal entry documenting plant health status and observations. Use this when the user wants to record plant health information.',
    parameters: {
      type: 'object',
      properties: {
        plantId: {
          type: 'string',
          description: 'The ID of the garden plant to log the journal for.',
        },
        note: {
          type: 'string',
          description: 'The main observation or note about the plant.',
        },
        healthStatus: {
          type: 'string',
          enum: ['HEALTHY', 'WARNING', 'CRITICAL', 'UNKNOWN'],
          description: 'The current health status of the plant.',
        },
        issueSummary: {
          type: 'string',
          description:
            'Optional summary of any issues or problems observed.',
        },
      },
      required: ['plantId', 'note', 'healthStatus'],
    },
  },
  {
    name: 'get_pending_tasks',
    description:
      'Get all pending care tasks for a specific plant. Use this when the user asks about upcoming or scheduled tasks.',
    parameters: {
      type: 'object',
      properties: {
        plantId: {
          type: 'string',
          description: 'The ID of the garden plant to get tasks for.',
        },
      },
      required: ['plantId'],
    },
  },
];

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  success: boolean;
  result?: unknown;
  error?: string;
}