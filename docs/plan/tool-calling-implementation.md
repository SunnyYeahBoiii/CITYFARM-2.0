# Implementation Plan: Garden Assistant Tool Calling

## Overview
Enable AI assistant to automatically create Plant Caring Tasks during chat conversations.
Full production: tool definitions, executor service, frontend confirmation flow, task cards in chat.

## Step 1: Backend Task Creation Endpoint

### 1.1 Create `apps/api/src/dtos/garden/create-care-task.dto.ts`

```typescript
import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { CareTaskType } from '@prisma/client';

export class CreateCareTaskDto {
  @IsEnum(CareTaskType)
  taskType: CareTaskType;

  @IsString()
  title: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
```

### 1.2 Add task creation in `apps/api/src/garden/garden.service.ts`

```typescript
async createCareTask(
  gardenPlantId: string,
  userId: string,
  data: { taskType: string; title: string; dueAt?: Date; notes?: string },
) {
  // Verify plant ownership
  const plant = await this.prisma.gardenPlant.findUnique({
    where: { id: gardenPlantId, userId },
  });
  if (!plant) throw new NotFoundException('Plant not found');

  // Check for duplicate pending task
  const existing = await this.prisma.careTask.findFirst({
    where: {
      gardenPlantId,
      taskType: data.taskType,
      status: 'PENDING',
      title: data.title,
    },
  });
  if (existing) return existing; // Return existing, don't duplicate

  return this.prisma.careTask.create({
    data: {
      gardenPlantId,
      taskType: data.taskType,
      title: data.title,
      dueAt: data.dueAt,
      notes: data.notes,
      status: 'PENDING',
      createdBy: 'AI_ASSISTANT',
    },
  });
}
```

### 1.3 Add endpoint in `apps/api/src/garden/garden.controller.ts`

```typescript
@Post('plants/:plantId/tasks')
@UseGuards(JwtAuthGuard)
async createTask(
  @CurrentUser() user: { id: string },
  @Param('plantId') plantId: string,
  @Body() body: CreateCareTaskDto,
) {
  return this.gardenService.createCareTask(plantId, user.id, body);
}
```

### 1.2 Add `createdBy` field to CareTask in `prisma/schema.prisma`

```prisma
model CareTask {
  // ... existing fields
  createdBy String?  @default("SYSTEM")  // USER, AI_ASSISTANT, SYSTEM
  // ...
}
```

---

## Step 2: Tool Definitions

### 2.1 Create `apps/api/src/ai/tool-definitions.ts`

```typescript
export const TOOL_DEFINITIONS = [
  {
    name: 'create_care_task',
    description: 'Create a scheduled care task for a plant. Use when the user asks to set a reminder, schedule watering, or mentions a care action needed.',
    parameters: {
      type: 'object',
      properties: {
        plantId: { type: 'string', description: 'The garden plant ID' },
        taskType: {
          type: 'string',
          enum: ['WATERING', 'FERTILIZING', 'PRUNING', 'ROTATING', 'PEST_CHECK', 'HARVEST', 'CUSTOM'],
          description: 'Type of care task',
        },
        title: { type: 'string', description: 'Short title for the task' },
        dueAt: { type: 'string', format: 'date-time', description: 'When the task is due (ISO 8601)' },
        notes: { type: 'string', description: 'Additional instructions or context' },
      },
      required: ['plantId', 'taskType', 'title'],
    },
  },
  {
    name: 'log_journal_entry',
    description: 'Create a journal entry documenting plant health. Use when the user describes a plant observation or health change.',
    parameters: {
      type: 'object',
      properties: {
        plantId: { type: 'string', description: 'The garden plant ID' },
        note: { type: 'string', description: 'Observation note' },
        healthStatus: { type: 'string', enum: ['HEALTHY', 'FAIR', 'POOR', 'CRITICAL'], description: 'Current health status' },
        issueSummary: { type: 'string', description: 'Brief description of any issues' },
      },
      required: ['plantId', 'note', 'healthStatus'],
    },
  },
  {
    name: 'get_pending_tasks',
    description: 'Get all pending care tasks for a plant. Use when the user asks what tasks are upcoming or what they need to do.',
    parameters: {
      type: 'object',
      properties: {
        plantId: { type: 'string', description: 'The garden plant ID' },
      },
      required: ['plantId'],
    },
  },
];
```

---

## Step 3: Tool Executor Service

### 3.1 Create `apps/api/src/ai/tool-executor.service.ts`

```typescript
@Injectable()
export class ToolExecutorService {
  constructor(
    private gardenService: GardenService,
  ) {}

  async execute(toolCall: ToolCall, userId: string): Promise<ToolResult> {
    switch (toolCall.name) {
      case 'create_care_task':
        return this.executeCreateTask(toolCall.arguments, userId);
      case 'log_journal_entry':
        return this.executeLogJournal(toolCall.arguments, userId);
      case 'get_pending_tasks':
        return this.executeGetPendingTasks(toolCall.arguments, userId);
      default:
        throw new Error(`Unknown tool: ${toolCall.name}`);
    }
  }

  private async executeCreateTask(args: any, userId: string): Promise<ToolResult> {
    const task = await this.gardenService.createCareTask(
      args.plantId,
      userId,
      {
        taskType: args.taskType,
        title: args.title,
        dueAt: args.dueAt ? new Date(args.dueAt) : undefined,
        notes: args.notes,
      },
    );

    return {
      tool: 'create_care_task',
      success: true,
      data: { taskId: task.id, title: task.title, type: task.taskType, dueAt: task.dueAt },
      message: `Task "${task.title}" created for ${args.plantId}`,
    };
  }

  private async executeLogJournal(args: any, userId: string): Promise<ToolResult> {
    const entry = await this.gardenService.logJournalEntry(
      args.plantId,
      userId,
      {
        note: args.note,
        healthStatus: args.healthStatus,
        issueSummary: args.issueSummary,
      },
    );

    return {
      tool: 'log_journal_entry',
      success: true,
      data: { entryId: entry.id },
      message: 'Journal entry logged',
    };
  }

  private async executeGetPendingTasks(args: any, userId: string): Promise<ToolResult> {
    const tasks = await this.gardenService.getPendingTasks(args.plantId, userId);

    return {
      tool: 'get_pending_tasks',
      success: true,
      data: tasks,
      message: `Found ${tasks.length} pending tasks`,
    };
  }
}

interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}

interface ToolResult {
  tool: string;
  success: boolean;
  data: any;
  message: string;
}
```

### 3.2 Register in `apps/api/src/ai/ai.module.ts`

```typescript
@Module({
  providers: [ModelApiService, ToolExecutorService],
  exports: [ModelApiService, ToolExecutorService],
})
export class AiModule {}
```

---

## Step 4: Modified Chat Flow with Tool Calling

### 4.1 Modify `apps/api/src/app.service.ts` - `processChatRequest`

Add tool calling loop:

```typescript
async processChatRequest(userId: string, message: string, plantId?: string, context?: any) {
  // ... existing setup ...

  // Step 1: Get AI response with tools
  const aiResponse = await this.modelApiService.getChatAdvice({
    message,
    context: ragContext,
    history: chatHistory,
    tools: TOOL_DEFINITIONS, // Pass tool definitions to AI
  });

  // Step 2: Check if AI returned tool calls
  if (aiResponse.tool_calls && aiResponse.tool_calls.length > 0) {
    const toolResults = [];

    for (const toolCall of aiResponse.tool_calls) {
      const result = await this.toolExecutorService.execute(toolCall, userId);
      toolResults.push(result);
    }

    // Step 3: Send tool results back to AI for final response
    const finalResponse = await this.modelApiService.getChatAdvice({
      message,
      context: ragContext,
      history: [...chatHistory, { role: 'assistant', content: JSON.stringify(toolResults) }],
    });

    return {
      success: true,
      reply: finalResponse.reply,
      toolCalls: toolResults.map(r => ({
        tool: r.tool,
        success: r.success,
        data: r.data,
      })),
      conversationId,
    };
  }

  // Normal response (no tools)
  return {
    success: true,
    reply: aiResponse.reply,
    conversationId,
  };
}
```

### 4.2 Modify `apps/api/src/ai/model-api.service.ts`

Update to support tool calling in Python API requests:

```typescript
async getChatAdvice(input: {
  message: string;
  context: any;
  history: Array<{ role: string; content: string }>;
  tools?: any[];
}) {
  const response = await fetch(this.modelApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: input.message,
      context: input.context,
      history: input.history,
      tools: input.tools, // Pass tools to Python model API
    }),
  });

  return response.json();
}
```

---

## Step 5: Python Model API Tool Support

### 5.1 Modify `apps/model-api/` (Python)

Add OpenAI-compatible tool calling:

```python
@app.post("/api/chat")
async def chat(request: ChatRequest):
    messages = build_messages(request)

    if request.tools:
        # Use tool-calling endpoint
        response = client.chat.completions.create(
            model=request.model,
            messages=messages,
            tools=request.tools,
            tool_choice="auto",
        )

        # Check for tool calls
        if response.choices[0].message.tool_calls:
            return {
                "reply": None,
                "tool_calls": [
                    {
                        "name": tc.function.name,
                        "arguments": json.loads(tc.function.arguments),
                    }
                    for tc in response.choices[0].message.tool_calls
                ],
            }

    # Normal response
    response = client.chat.completions.create(
        model=request.model,
        messages=messages,
    )
    return {"reply": response.choices[0].message.content}
```

---

## Step 6: Frontend Tool Confirmation Flow

### 6.1 Create `apps/web/components/chatbot/TaskPreviewCard.tsx`

```typescript
interface TaskPreviewCardProps {
  tool: 'create_care_task';
  data: { title: string; type: string; dueAt: string | null; notes: string | null };
  onConfirm: () => void;
  onReject: () => void;
}

export function TaskPreviewCard({ data, onConfirm, onReject }: TaskPreviewCardProps) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-3 my-2">
      <p className="text-sm font-medium text-green-800">
        AI suggests creating a task:
      </p>
      <div className="mt-1">
        <p className="font-semibold">{data.title}</p>
        <p className="text-xs text-gray-500">Type: {data.type}</p>
        {data.dueAt && <p className="text-xs text-gray-500">Due: {new Date(data.dueAt).toLocaleDateString()}</p>}
        {data.notes && <p className="text-xs text-gray-500">{data.notes}</p>}
      </div>
      <div className="flex gap-2 mt-2">
        <button onClick={onConfirm} className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg">
          Create
        </button>
        <button onClick={onReject} className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg">
          Skip
        </button>
      </div>
    </div>
  );
}
```

### 6.2 Modify `apps/web/components/chatbot/ChatbotScreen.tsx`

Handle tool calls in response:

```typescript
// In sendMessage function:
const response = await postChat(message, plantId, context, conversationId);

// Check for tool calls
if (response.toolCalls && response.toolCalls.length > 0) {
  // Add tool preview to messages
  for (const toolCall of response.toolCalls) {
    if (toolCall.tool === 'create_care_task') {
      // Show confirmation card - wait for user action
      const confirmed = await showTaskConfirmation(toolCall.data);
      if (!confirmed) {
        // Add rejection message to chat
        addMessage({ role: 'system', content: 'Task creation skipped' });
        continue;
      }
    }
  }
}

addMessage({ role: 'assistant', content: response.reply });
```

### 6.3 Confirmation flow

```typescript
function showTaskConfirmation(data: any): Promise<boolean> {
  return new Promise((resolve) => {
    setPendingConfirmation({ data, resolve });
  });
}

// In render:
{pendingConfirmation && (
  <TaskPreviewCard
    tool="create_care_task"
    data={pendingConfirmation.data}
    onConfirm={() => {
      pendingConfirmation.resolve(true);
      setPendingConfirmation(null);
    }}
    onReject={() => {
      pendingConfirmation.resolve(false);
      setPendingConfirmation(null);
    }}
  />
)}
```

### 6.4 Execute confirmed task

When user confirms, call the task creation endpoint:

```typescript
const { mutate: createTask } = useMutation({
  mutationFn: (taskData: CreateCareTaskDto) =>
    apiFetch(`/api/garden/plants/${plantId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    }),
});
```

### 6.5 Show created task inline

After task creation, render a task card in the message stream:

```typescript
function TaskCreatedCard({ task }: { task: any }) {
  return (
    <div className="bg-green-100 border border-green-300 rounded-xl p-3 my-2">
      <p className="text-sm font-medium text-green-800">
        Task created: {task.title}
      </p>
      <p className="text-xs text-gray-500">Due: {new Date(task.dueAt).toLocaleDateString()}</p>
    </div>
  );
}
```

---

## Files Changed

| File | Change |
|------|--------|
| `apps/api/prisma/schema.prisma` | Add `createdBy` field to CareTask |
| `apps/api/src/dtos/garden/create-care-task.dto.ts` | New: task creation DTO |
| `apps/api/src/garden/garden.service.ts` | Add `createCareTask` method |
| `apps/api/src/garden/garden.controller.ts` | Add `POST plants/:plantId/tasks` |
| `apps/api/src/ai/tool-definitions.ts` | New: tool definitions |
| `apps/api/src/ai/tool-executor.service.ts` | New: tool execution service |
| `apps/api/src/ai/ai.module.ts` | Register ToolExecutorService |
| `apps/api/src/app.service.ts` | Add tool calling loop to `processChatRequest` |
| `apps/api/src/ai/model-api.service.ts` | Pass tools to Python model API |
| `apps/model-api/` (Python) | Add tool calling support |
| `apps/web/components/chatbot/TaskPreviewCard.tsx` | New: task confirmation card |
| `apps/web/components/chatbot/ChatbotScreen.tsx` | Handle tool calls, confirmation flow |

---

## Testing Checklist

- [ ] AI suggests task creation during relevant conversation
- [ ] Tool calls parsed correctly from AI response
- [ ] Tool executor creates task in database
- [ ] Task preview card shown to user
- [ ] User can confirm or reject task
- [ ] Confirmed task saved, rejected task skipped
- [ ] Task created card shown in chat after confirmation
- [ ] Duplicate task detection works
- [ ] Plant ownership validated (can't create tasks for other user's plants)
- [ ] Tool calling works with multiple tools in single response
- [ ] Fallback to normal response when no tools needed
