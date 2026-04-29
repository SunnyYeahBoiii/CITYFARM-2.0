# Garden Assistant Tool Calling Feature - Research Report

## Executive Summary
This report analyzes the current system architecture and provides recommendations for implementing AI tool calling capabilities that allow the Garden Assistant to automatically create Plant Caring Tasks during chat interactions.

---

## 1. Current CareTask Model Structure

### 1.1 CareTask Prisma Model (apps/api/prisma/schema.prisma)

```prisma
model CareTask {
  id            String         @id @default(uuid())
  gardenPlantId String         // FK to GardenPlant
  scheduleId    String?        // Optional FK to CareSchedule
  taskType      CareTaskType   // Enum: WATERING, FERTILIZING, PRUNING, etc.
  status        CareTaskStatus @default(PENDING)
  title         String
  description   String?
  dueAt         DateTime
  completedAt   DateTime?
  skippedAt     DateTime?
  aiSummary     String?        // AI-generated summary field
  metadata      Json?          // Flexible metadata storage
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  
  gardenPlant   GardenPlant    @relation(...)
  schedule      CareSchedule?  @relation(...)
  
  @@index([gardenPlantId, status, dueAt])
  @@index([scheduleId])
}
```

### 1.2 CareTaskType Enum
```prisma
enum CareTaskType {
  WATERING      // Water the plant
  FERTILIZING   // Apply fertilizer
  PRUNING       // Trim/prune branches
  ROTATING      // Rotate plant position
  PEST_CHECK    // Inspect for pests
  HARVEST       // Harvest ready produce
  CUSTOM        // User-defined task
}
```

### 1.3 CareTaskStatus Enum
```prisma
enum CareTaskStatus {
  PENDING     // Task not yet done
  COMPLETED   // Task finished
  SKIPPED     // Task intentionally skipped
  OVERDUE     // Task past due date
}
```

### 1.4 CareSchedule Model (for recurring tasks)
```prisma
model CareSchedule {
  id              String       @id @default(uuid())
  gardenPlantId   String
  taskType        CareTaskType
  title           String
  description     String?
  cadenceDays     Int?         // Recurrence interval in days
  preferredHour   Int?         // Preferred time
  preferredMinute Int?         @default(0)
  startsAt        DateTime
  endsAt          DateTime?
  isActive        Boolean      @default(true)
  metadata        Json?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  
  gardenPlant     GardenPlant  @relation(...)
  tasks           CareTask[]   // Generated tasks from schedule
  
  @@index([gardenPlantId, isActive])
}
```

### 1.5 Related Models

**GardenPlant** (owns CareTasks):
- `careTasks: CareTask[]` - One-to-many relation
- `careSchedules: CareSchedule[]` - Recurring schedules
- `journalEntries: PlantJournalEntry[]` - Health journals
- Fields: status, healthStatus, growthStage, nickname, notes

**PlantJournalEntry** (for logging plant health):
```prisma
model PlantJournalEntry {
  id                    String             @id @default(uuid())
  gardenPlantId         String
  imageAssetId          String?
  capturedAt            DateTime           @default(now())
  note                  String?
  healthStatus          PlantHealthStatus?
  leafColorNote         String?
  issueSummary          String?
  recommendationSummary String?
  aiAnalysis            Json?
  createdAt             DateTime           @default(now())
  updatedAt             DateTime           @updatedAt
}
```

---

## 2. How Tasks Are Currently Created

### 2.1 API Endpoints (apps/api/src/garden/garden.controller.ts)

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/garden/:plantId/care` | POST | Mark task as completed (logCare) | Yes (JwtAuthGuard) |
| `/garden/:plantId/journal` | POST | Create journal entry | Yes |
| `/garden/activate` | POST | Activate kit & create plant + schedules | Yes |
| `/garden` | GET | Get user's garden (plants with tasks) | Yes |
| `/garden/stats` | GET | Garden statistics | Yes |
| `/garden/:plantId` | GET | Plant detail with tasks & journals | Yes |

### 2.2 Service Methods (apps/api/src/garden/garden.service.ts)

**logCare(userId, plantId, dto)** - Marks existing task as completed:
```typescript
async logCare(userId: string, plantId: string, dto: LogCareDto) {
  // 1. Find task by taskId, validate ownership
  // 2. Check if already completed
  // 3. Validate timing (can't complete early future tasks)
  // 4. Update status to COMPLETED, set completedAt
  // 5. If has schedule, generate next task from schedule
  // 6. Update plant's lastCareAt
}
```

**logJournal(userId, plantId, dto)** - Creates journal entry:
```typescript
async logJournal(userId: string, plantId: string, dto: LogJournalDto) {
  // 1. Validate plant ownership
  // 2. Validate image asset if provided
  // 3. If image, run AI health analysis (analyzePlantHealth)
  // 4. Create PlantJournalEntry with AI analysis results
  // 5. Update plant health status based on analysis
}
```

**activateCode(userId, code)** - Creates plant + initial tasks:
```typescript
async activateCode(userId: string, code: string) {
  // 1. Validate activation code
  // 2. Create GardenPlant record
  // 3. Call _createCareSchedulesForPlant()
  //    - Creates CareSchedule records
  //    - Creates initial CareTask for each schedule
  // 4. Mark code as redeemed
}
```

**_createCareSchedulesForPlant(tx, plantId, speciesSlug, plantedAt)**:
```typescript
// Uses plant-care-data constants to get species-specific care requirements
// For each care type (watering, fertilizing, etc.):
//   1. Create CareSchedule with cadence
//   2. Create first CareTask with dueAt based on cadence
```

### 2.3 DTOs

**LogCareDto** (apps/api/src/dtos/garden/log-care.dto.ts):
```typescript
export class LogCareDto {
  @IsString()
  @IsNotEmpty()
  taskId: string;  // Only taskId required - marks existing task as done
}
```

**LogJournalDto** (apps/api/src/dtos/garden/log-journal.dto.ts):
```typescript
export class LogJournalDto {
  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsEnum(PlantHealthStatus) healthStatus?: PlantHealthStatus;
  @IsOptional() @IsEnum(PlantGrowthStage) growthStage?: PlantGrowthStage;
  @IsOptional() @IsString() leafColorNote?: string;
  @IsOptional() @IsString() issueSummary?: string;
  @IsOptional() @IsString() imageAssetId?: string;
}
```

### 2.4 Current Chat Flow (apps/api/src/app.service.ts)

**processChatRequest(userId, plantId, message)**:
```typescript
// 1. Fetch plant data (species, careProfile, recent tasks, journals)
// 2. Find/create AI conversation
// 3. Get chat history (last 20 messages)
// 4. Build RAG context with:
//    - User profile info
//    - Species details + care profile
//    - Current plant status, health, growth stage
//    - Recent completed tasks
//    - Recent journal entries
// 5. Call modelApiService.getChatAdvice({ message, context, history })
// 6. Save user message to conversation
// 7. Extract reply from AI response
// 8. Save AI message to conversation
// 9. Return { success: true, reply, conversationId }
```

**Current AI Response Handling**:
- AI returns `{ success: true, reply: "..." }` (plain text response)
- No tool calling support - just conversational advice
- No ability to create tasks, journals, or take actions

---

## 3. What's Needed for Tool Calling

### 3.1 Tool Calling Architecture

The AI needs to:
1. Receive **tool definitions** in the API request (what tools are available)
2. Return **tool calls** in its response (what actions to take)
3. Backend **executes tool calls** (actually creates tasks)
4. Tool results **fed back to AI** (optional: let AI know action succeeded)
5. Final response **returned to user** (confirmation + explanation)

### 3.2 Required Components

1. **Tool Definitions Schema** - Define tools for AI model
2. **Tool Execution Service** - Parse and execute tool calls
3. **Tool Result Handler** - Process results and optionally re-prompt AI
4. **DTOs for Tool Parameters** - Validate tool input parameters
5. **Frontend Loading States** - Show "AI is creating task..."

---

## 4. Recommended Tool Definitions for AI

### 4.1 Tool: create_care_task

Create a new care task for a plant.

```json
{
  "name": "create_care_task",
  "description": "Create a new care task for a plant. Use this when the user asks to set up a reminder, schedule a task, or when you identify a care need during conversation.",
  "parameters": {
    "type": "object",
    "properties": {
      "gardenPlantId": {
        "type": "string",
        "description": "The ID of the plant to create the task for. Use the current plant ID from context."
      },
      "taskType": {
        "type": "string",
        "enum": ["WATERING", "FERTILIZING", "PRUNING", "ROTATING", "PEST_CHECK", "HARVEST", "CUSTOM"],
        "description": "Type of care task to create"
      },
      "title": {
        "type": "string",
        "description": "Task title (e.g., 'Water your Tomato plant')"
      },
      "description": {
        "type": "string",
        "description": "Optional detailed description of what to do"
      },
      "dueAt": {
        "type": "string",
        "format": "date-time",
        "description": "When the task should be done (ISO 8601 format)"
      },
      "aiSummary": {
        "type": "string",
        "description": "AI-generated context about why this task was created"
      }
    },
    "required": ["gardenPlantId", "taskType", "title", "dueAt"]
  }
}
```

### 4.2 Tool: update_care_task

Update an existing care task.

```json
{
  "name": "update_care_task",
  "description": "Update an existing care task's details or status.",
  "parameters": {
    "type": "object",
    "properties": {
      "taskId": {
        "type": "string",
        "description": "ID of the task to update"
      },
      "status": {
        "type": "string",
        "enum": ["PENDING", "COMPLETED", "SKIPPED", "OVERDUE"],
        "description": "New status for the task"
      },
      "dueAt": {
        "type": "string",
        "format": "date-time",
        "description": "New due date"
      },
      "description": {
        "type": "string",
        "description": "Updated description"
      }
    },
    "required": ["taskId"]
  }
}
```

### 4.3 Tool: log_care_completion

Mark a task as completed.

```json
{
  "name": "log_care_completion",
  "description": "Mark a care task as completed. Use when user confirms they did the task.",
  "parameters": {
    "type": "object",
    "properties": {
      "taskId": {
        "type": "string",
        "description": "ID of the task to mark as completed"
      },
      "aiSummary": {
        "type": "string",
        "description": "Optional AI-generated note about the completion"
      }
    },
    "required": ["taskId"]
  }
}
```

### 4.4 Tool: log_journal_entry

Create a journal entry for a plant.

```json
{
  "name": "log_journal_entry",
  "description": "Create a journal entry to track plant health. Use when user reports plant condition or uploads a photo.",
  "parameters": {
    "type": "object",
    "properties": {
      "gardenPlantId": {
        "type": "string",
        "description": "Plant ID"
      },
      "note": {
        "type": "string",
        "description": "User's notes about the plant"
      },
      "healthStatus": {
        "type": "string",
        "enum": ["UNKNOWN", "HEALTHY", "WARNING", "CRITICAL"],
        "description": "Health status assessment"
      },
      "growthStage": {
        "type": "string",
        "enum": ["SEEDED", "SPROUTING", "VEGETATIVE", "FLOWERING", "FRUITING", "HARVEST_READY", "HARVESTED"],
        "description": "Current growth stage"
      },
      "issueSummary": {
        "type": "string",
        "description": "Summary of any issues detected"
      }
    },
    "required": ["gardenPlantId"]
  }
}
```

### 4.5 Tool: get_pending_tasks

Get pending tasks for a plant (informative tool).

```json
{
  "name": "get_pending_tasks",
  "description": "Retrieve pending care tasks for a plant. Use to show user their upcoming tasks.",
  "parameters": {
    "type": "object",
    "properties": {
      "gardenPlantId": {
        "type": "string",
        "description": "Plant ID to query"
      }
    },
    "required": ["gardenPlantId"]
  }
}
```

### 4.6 Tool: create_care_schedule

Create a recurring care schedule.

```json
{
  "name": "create_care_schedule",
  "description": "Create a recurring care schedule for a plant. Generates automatic tasks on specified cadence.",
  "parameters": {
    "type": "object",
    "properties": {
      "gardenPlantId": {
        "type": "string",
        "description": "Plant ID"
      },
      "taskType": {
        "type": "string",
        "enum": ["WATERING", "FERTILIZING", "PRUNING", "ROTATING", "PEST_CHECK", "HARVEST", "CUSTOM"],
        "description": "Type of care"
      },
      "title": {
        "type": "string",
        "description": "Schedule title"
      },
      "cadenceDays": {
        "type": "integer",
        "description": "How often to repeat (in days)"
      },
      "preferredHour": {
        "type": "integer",
        "description": "Preferred hour (0-23)"
      },
      "startsAt": {
        "type": "string",
        "format": "date-time",
        "description": "When schedule starts"
      }
    },
    "required": ["gardenPlantId", "taskType", "title", "cadenceDays", "startsAt"]
  }
}
```

---

## 5. Integration into Chat Flow

### 5.1 Backend Flow

```
User Message → AppService.processChatRequest()
    ↓
1. Build RAG context (current flow)
    ↓
2. Add tool definitions to model API request:
   {
     message,
     context: ragContext,
     history: chatHistory,
     tools: [create_care_task, update_care_task, log_journal_entry, ...],
     tool_choice: "auto"  // or "required" for forcing tool use
   }
    ↓
3. Call ModelApiService.getChatAdvice()
    ↓
4. Parse AI response:
   - If has tool_calls → execute tools → return tool results
   - If only text reply → return as-is
    ↓
5. (Optional) If tool executed, re-prompt AI with tool results:
   {
     message: "Tool executed successfully",
     tool_results: [{ tool: "create_care_task", success: true, taskId: "..." }]
   }
    ↓
6. Return final response to frontend:
   {
     success: true,
     reply: "I've created a watering task for you...",
     toolExecuted: true,
     toolResults: [...],
     conversationId: "..."
   }
```

### 5.2 Proposed AppService Changes

```typescript
// apps/api/src/app.service.ts

interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

interface ToolResult {
  toolCallId: string;
  success: boolean;
  result?: unknown;
  error?: string;
}

// New method: build tool definitions
private buildToolDefinitions(plantId: string): ToolDefinition[] {
  return [
    {
      name: 'create_care_task',
      description: 'Create a new care task...',
      parameters: { ... }
    },
    // ... other tools
  ];
}

// New method: execute tool calls
private async executeToolCall(
  userId: string,
  toolCall: ToolCall
): Promise<ToolResult> {
  switch (toolCall.name) {
    case 'create_care_task':
      return this.executeCreateCareTask(userId, toolCall.arguments);
    case 'update_care_task':
      return this.executeUpdateCareTask(userId, toolCall.arguments);
    case 'log_journal_entry':
      return this.executeLogJournal(userId, toolCall.arguments);
    // ...
  }
}

// Modified processChatRequest
async processChatRequest(userId: string, plantId: string, message: string) {
  // ... existing context building ...
  
  const toolDefinitions = this.buildToolDefinitions(plantId);
  
  const aiResponse = await this.modelApiService.getChatAdvice({
    message,
    context: ragContext,
    history: chatHistory,
    tools: toolDefinitions,
    tool_choice: 'auto'
  });
  
  // Parse response for tool calls
  const toolCalls = this.extractToolCalls(aiResponse);
  
  if (toolCalls.length > 0) {
    // Execute tools
    const toolResults = await Promise.all(
      toolCalls.map(tc => this.executeToolCall(userId, tc))
    );
    
    // (Optional) Re-prompt AI with tool results
    const followUpResponse = await this.modelApiService.getChatAdvice({
      message: 'Tools executed',
      tool_results: toolResults,
      context: ragContext,
    });
    
    return {
      success: true,
      reply: followUpResponse.reply || 'Tasks created successfully!',
      toolExecuted: true,
      toolResults,
      conversationId: conversation.id
    };
  }
  
  // ... existing flow for plain text response ...
}

// Tool execution implementations
private async executeCreateCareTask(
  userId: string,
  args: CreateCareTaskArgs
): Promise<ToolResult> {
  // 1. Validate args
  // 2. Validate plant ownership
  // 3. Create CareTask via Prisma
  // 4. Return { success: true, taskId: ... }
}
```

### 5.3 Model API Service Changes

```typescript
// apps/api/src/ai/model-api.service.ts

// Enhanced getChatAdvice to support tools
async getChatAdvice(payload: ChatPayload) {
  return this.postJson('/api/chat', {
    message: payload.message,
    context: payload.context,
    history: payload.history,
    tools: payload.tools,        // NEW
    tool_choice: payload.tool_choice, // NEW
    tool_results: payload.tool_results // NEW (for follow-up)
  });
}
```

---

## 6. Safety Considerations

### 6.1 User Confirmation Before Creating Tasks

**Recommended Approach**: Two-step confirmation for task creation.

1. **Preview Mode** (default):
   - AI suggests task in chat: "I recommend creating a watering task tomorrow. Should I add this to your schedule?"
   - User confirms: "Yes, create it"
   - AI then executes tool

2. **Auto-create Mode** (optional, for trusted scenarios):
   - AI can create tasks directly for simple/urgent needs
   - Still validate plant ownership and parameters

**Implementation**:
```typescript
// Add confirmation_required field to tool definition
{
  "name": "create_care_task",
  "confirmation_required": true,  // AI should ask before executing
  "confirmation_prompt": "Should I create this task for you?",
  ...
}

// Or use tool_choice: "auto" but parse AI intent
// If AI returns tool_call with needs_confirmation: true,
// return preview to frontend instead of executing
```

### 6.2 Validation Checklist

| Check | Implementation |
|-------|----------------|
| Plant ownership | Verify gardenPlantId belongs to userId |
| Valid taskType | Enum validation in DTO |
| Reasonable dueAt | Not in past, not >1 year future |
| Required fields | DTO validation with class-validator |
| Rate limiting | Max 5 tasks per plant per day |
| Duplicate check | Don't create same taskType + dueAt |

### 6.3 New DTOs for Tool Parameters

```typescript
// apps/api/src/dtos/garden/create-care-task.dto.ts

import { IsString, IsEnum, IsDateString, IsOptional, IsUUID } from 'class-validator';
import { CareTaskType } from 'generated/prisma/enums';

export class CreateCareTaskDto {
  @IsUUID()
  gardenPlantId: string;

  @IsEnum(CareTaskType)
  taskType: CareTaskType;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  dueAt: string;

  @IsOptional()
  @IsString()
  aiSummary?: string;
}
```

---

## 7. Backend Changes Needed

### 7.1 New Files to Create

| File | Purpose |
|------|---------|
| `apps/api/src/dtos/garden/create-care-task.dto.ts` | DTO for task creation |
| `apps/api/src/dtos/garden/update-care-task.dto.ts` | DTO for task update |
| `apps/api/src/dtos/garden/tool-execution.dto.ts` | DTO for tool call parsing |
| `apps/api/src/ai/tool-executor.service.ts` | Service to execute AI tool calls |
| `apps/api/src/ai/tool-definitions.ts` | Tool definition constants |

### 7.2 Files to Modify

| File | Changes |
|------|---------|
| `apps/api/src/app.service.ts` | Add tool handling in processChatRequest |
| `apps/api/src/ai/model-api.service.ts` | Update getChatAdvice to pass tools |
| `apps/api/src/garden/garden.service.ts` | Add createTask method (for manual task creation) |
| `apps/api/src/garden/garden.controller.ts` | Add POST `/garden/:plantId/tasks` endpoint |

### 7.3 New Service: ToolExecutorService

```typescript
// apps/api/src/ai/tool-executor.service.ts

@Injectable()
export class ToolExecutorService {
  constructor(
    private gardenService: GardenService,
    private prisma: PrismaService,
  ) {}

  async execute(userId: string, toolCall: ToolCall): Promise<ToolResult> {
    // Validate and execute each tool type
  }

  async executeCreateCareTask(userId: string, args: CreateCareTaskDto): Promise<ToolResult> {
    // 1. Validate plant ownership
    const plant = await this.prisma.gardenPlant.findFirst({
      where: { id: args.gardenPlantId, userId }
    });
    if (!plant) throw new NotFoundException('Plant not found');

    // 2. Create task
    const task = await this.prisma.careTask.create({
      data: {
        gardenPlantId: args.gardenPlantId,
        taskType: args.taskType,
        title: args.title,
        description: args.description,
        dueAt: new Date(args.dueAt),
        aiSummary: args.aiSummary,
        status: 'PENDING',
      }
    });

    return { success: true, taskId: task.id, task };
  }
}
```

### 7.4 New Endpoint: Manual Task Creation

```typescript
// apps/api/src/garden/garden.controller.ts

@Post(':plantId/tasks')
async createTask(
  @CurrentUser('id') userId: string,
  @Param('plantId') plantId: string,
  @Body() body: CreateCareTaskDto,
) {
  return this.gardenService.createTask(userId, plantId, body);
}
```

---

## 8. Frontend Changes Needed

### 8.1 ChatbotScreen Changes

**Current State**: ChatbotScreen shows messages, handles user input.

**Needed Changes**:

1. **Loading indicator for tool execution**:
   ```typescript
   // When AI response indicates tool_executed: true
   // Show: "Creating task..." or "AI is setting up your schedule..."
   ```

2. **Tool result display**:
   ```typescript
   // Show created task summary
   // Example: "Created: Watering task for tomorrow"
   ```

3. **Confirmation UI** (if implementing preview mode):
   ```typescript
   // Modal/prompt asking user to confirm task creation
   // "AI wants to create a watering task. Allow?"
   // [Yes] [No] [Modify]
   ```

### 8.2 Proposed ChatMessage Enhancement

```typescript
// apps/web/src/components/ChatMessage.tsx

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolExecuted?: boolean;
  toolResults?: ToolResult[];
  timestamp: Date;
}

// Render tool results as action cards
function ToolResultCard({ result }: { result: ToolResult }) {
  if (result.tool === 'create_care_task' && result.success) {
    return (
      <View style={styles.toolCard}>
        <Icon name="check-circle" color="green" />
        <Text>Task Created: {result.task.title}</Text>
        <Text>Due: {formatDate(result.task.dueAt)}</Text>
      </View>
    );
  }
}
```

### 8.3 State Updates During Tool Execution

```typescript
// apps/web/src/screens/ChatbotScreen.tsx

const [isToolExecuting, setIsToolExecuting] = useState(false);
const [toolStatus, setToolStatus] = useState<string | null>(null);

async function sendMessage(message: string) {
  setIsLoading(true);
  
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message, plantId }),
  });
  
  const data = await response.json();
  
  // Check if tool was executed
  if (data.toolExecuted) {
    setIsToolExecuting(true);
    setToolStatus('AI is creating your task...');
    
    // Show confirmation animation
    setTimeout(() => {
      setIsToolExecuting(false);
      setToolStatus(null);
      // Add message with tool result
      addMessage({
        role: 'assistant',
        content: data.reply,
        toolExecuted: true,
        toolResults: data.toolResults,
      });
    }, 1000);
  }
}
```

---

## 9. Implementation Roadmap

### Phase 1: Foundation (Week 1)
1. Create tool definitions file
2. Add DTOs for tool parameters
3. Create ToolExecutorService (basic structure)
4. Add createTask method to GardenService

### Phase 2: Integration (Week 2)
1. Modify processChatRequest to include tools
2. Update ModelApiService to pass tools
3. Implement tool call parsing
4. Test create_care_task execution

### Phase 3: Model API (Week 3)
1. Update model-api (Python service) to support tool calling
2. Implement tool_choice parameter handling
3. Test full tool calling flow

### Phase 4: Frontend (Week 4)
1. Add tool execution loading states
2. Display tool result cards
3. Add confirmation UI (optional)
4. End-to-end testing

### Phase 5: Safety & Polish (Week 5)
1. Add validation middleware
2. Rate limiting
3. Error handling
4. User confirmation flows
5. Documentation

---

## 10. Key Files Summary

| File Path | Purpose |
|-----------|---------|
| `apps/api/prisma/schema.prisma` | CareTask, CareSchedule, GardenPlant models |
| `apps/api/src/garden/garden.service.ts` | logCare, logJournal, activateCode |
| `apps/api/src/garden/garden.controller.ts` | REST endpoints for garden operations |
| `apps/api/src/ai/model-api.service.ts` | Proxy to Python model API |
| `apps/api/src/app.service.ts` | processChatRequest (main chat handler) |
| `apps/api/src/app.controller.ts` | POST /api/chat endpoint |
| `apps/api/src/dtos/garden/log-care.dto.ts` | LogCareDto (taskId only) |
| `apps/api/src/dtos/garden/log-journal.dto.ts` | LogJournalDto (journal fields) |
| `apps/api/generated/prisma/models/CareTask.ts` | Generated Prisma types |

---

## 11. Appendix: Enum Values

### CareTaskType
| Value | Description |
|-------|-------------|
| WATERING | Water the plant |
| FERTILIZING | Apply fertilizer/nutrients |
| PRUNING | Trim or prune branches |
| ROTATING | Rotate plant position for even light |
| PEST_CHECK | Inspect for pests/diseases |
| HARVEST | Harvest ready produce |
| CUSTOM | User-defined custom task |

### CareTaskStatus
| Value | Description |
|-------|-------------|
| PENDING | Task not yet performed |
| COMPLETED | Task finished successfully |
| SKIPPED | Task intentionally skipped |
| OVERDUE | Task past due date without completion |

### PlantHealthStatus
| Value | Description |
|-------|-------------|
| UNKNOWN | Health not assessed |
| HEALTHY | Plant in good condition |
| WARNING | Some issues detected |
| CRITICAL | Serious problems requiring attention |

### GardenPlantStatus
| Value | Description |
|-------|-------------|
| PLANNED | Planned but not yet planted |
| ACTIVE | Currently growing |
| HARVEST_READY | Ready for harvest |
| HARVESTED | Already harvested |
| FAILED | Plant died or failed |
| ARCHIVED | No longer tracked |

---

*Report generated: 2026-04-28*
*Knowledge base sources: Prisma Schema, Garden Service, App Service, Model-API Service, Garden Controller*