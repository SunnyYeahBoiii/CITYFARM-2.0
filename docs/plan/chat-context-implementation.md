# Implementation Plan: Garden Assistant Chat Context

## Overview
Enable Garden Assistant to load conversation history on mount and inject enhanced journal data into AI context.
Full production: conversation persistence, full journal retrieval, loading states, error handling.

## Step 1: Backend Conversation History Endpoint

### 1.1 Modify `apps/api/src/app.service.ts`

Add `getConversationHistory` method:

```typescript
async getConversationHistory(userId: string, plantId: string) {
  const conversation = await this.findOrCreateAIConversation(userId, plantId);

  const messages = await this.prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'asc' },
    take: 50, // configurable limit, up from 20
  });

  return {
    conversationId: conversation.id,
    messages: messages.map(m => ({
      id: m.id,
      role: m.senderType === 'USER' ? 'user' as const : 'assistant' as const,
      content: m.body,
      createdAt: m.createdAt,
    })),
  };
}
```

### 1.2 Add endpoint in `apps/api/src/app.controller.ts`

```typescript
@Get('api/chat/conversation/:plantId')
@UseGuards(JwtAuthGuard)
async getConversation(
  @CurrentUser() user: { id: string },
  @Param('plantId') plantId: string,
) {
  return this.appService.getConversationHistory(user.id, plantId);
}
```

### 1.3 Modify existing `processChatRequest` to return `conversationId`

Current response: `{ success: true, reply: '...' }`
New response: `{ success: true, reply: '...', conversationId: '...' }`

Find the existing chat handler and add `conversationId` to the response when a conversation exists.

---

## Step 2: Enhanced Plant Context Builder

### 2.1 Modify `apps/api/src/app.service.ts`

Enhance the `processChatRequest` RAG context builder:

```typescript
async buildEnhancedPlantContext(plantId: string, userId: string) {
  const plant = await this.prisma.gardenPlant.findUnique({
    where: { id: plantId, userId },
    include: {
      plantSpecies: {
        include: {
          careProfile: true,
        },
      },
      journalEntries: {
        orderBy: { capturedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          capturedAt: true,
          note: true,
          healthStatus: true,
          issueSummary: true,
          recommendationSummary: true,
          aiAnalysis: true,
          leafColorNote: true,
        },
      },
      careTasks: {
        where: { status: 'PENDING' },
        orderBy: { dueAt: 'asc' },
        take: 5,
        select: {
          id: true,
          taskType: true,
          title: true,
          dueAt: true,
          notes: true,
        },
      },
    },
  });

  if (!plant) return null;

  return {
    species: {
      commonName: plant.plantSpecies.commonName,
      scientificName: plant.plantSpecies.scientificName,
      difficulty: plant.plantSpecies.difficulty,
      lightRequirement: plant.plantSpecies.lightRequirement,
      careGuide: plant.plantSpecies.careProfile?.careGuide,
    },
    currentPlant: {
      nickname: plant.nickname,
      status: plant.status,
      health: plant.healthStatus,
      growthStage: plant.growthStage,
      daysGrowing: Math.floor(
        (Date.now() - plant.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      ),
      zoneName: plant.zoneName,
      notes: plant.notes,
    },
    recentJournals: plant.journalEntries.map(j => ({
      date: j.capturedAt,
      health: j.healthStatus,
      issue: j.issueSummary,
      recommendation: j.recommendationSummary,
      note: j.note,
      aiAnalysis: j.aiAnalysis,
      leafColor: j.leafColorNote,
    })),
    pendingTasks: plant.careTasks.map(t => ({
      type: t.taskType,
      title: t.title,
      due: t.dueAt,
      notes: t.notes,
    })),
  };
}
```

### 2.2 Update prompt construction

Modify the RAG context formatting in `processChatRequest` to include the enhanced data:

```typescript
const contextPrompt = `
Plant: ${context.currentPlant.nickname} (${context.species.commonName})
Health: ${context.currentPlant.health} | Stage: ${context.currentPlant.growthStage}
Days growing: ${context.currentPlant.daysGrowing}

Species care guide: ${context.species.careGuide ?? 'Not available'}

Recent journal entries (newest first):
${context.recentJournals.map(j =>
  `- ${j.date.toISOString().split('T')[0]}: Health=${j.health}, Issue: ${j.issue ?? 'None'}, Notes: ${j.note ?? ''}`
).join('\n')}

Pending care tasks:
${context.pendingTasks.map(t =>
  `- ${t.type}: ${t.title} (due: ${t.dueAt?.toISOString().split('T')[0] ?? 'No date'})`
).join('\n')}
`;
```

---

## Step 3: Frontend Conversation Load

### 3.1 Create `apps/web/lib/useConversationHistory.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './client';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface ConversationData {
  conversationId: string;
  messages: ChatMessage[];
}

async function fetchConversation(plantId: string): Promise<ConversationData> {
  const res = await apiFetch(`/api/chat/conversation/${plantId}`);
  if (!res.ok) throw new Error('Failed to load conversation');
  return res.json();
}

export function useConversationHistory(plantId: string | null) {
  return useQuery<ConversationData>({
    queryKey: ['conversation', plantId],
    queryFn: () => fetchConversation(plantId!),
    enabled: !!plantId,
    staleTime: 1000 * 60 * 5,
  });
}
```

### 3.2 Modify `apps/web/components/chatbot/ChatbotScreen.tsx`

Changes needed:

1. **Load conversation on mount:**
```typescript
const { data: conversation, isLoading: loadingHistory } = useConversationHistory(plantId);

useEffect(() => {
  if (conversation?.messages) {
    setMessages(conversation.messages.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
    })));
  }
}, [conversation]);
```

2. **Track conversationId:**
```typescript
const [conversationId, setConversationId] = useState<string | null>(null);

// Set from loaded conversation
useEffect(() => {
  if (conversation?.conversationId) {
    setConversationId(conversation.conversationId);
  }
}, [conversation]);
```

3. **Pass conversationId in subsequent messages:**
```typescript
// In sendMessage function:
await postChat(message, plantId, context, conversationId);
```

4. **Loading state:**
```typescript
if (loadingHistory) {
  return <ConversationSkeleton />;
}
```

5. **Skeleton component:**
```typescript
function ConversationSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
          <div className="h-10 bg-gray-200 rounded-xl w-2/3" />
        </div>
      ))}
    </div>
  );
}
```

---

## Step 4: Frontend Plant Context

### 4.1 Modify `apps/web/lib/plant-chat-context.ts`

Enhance the context builder to include more plant data:

```typescript
export async function buildPlantContext(plantId: string) {
  const res = await apiFetch(`/api/garden/plants/${plantId}/chat-context`);
  if (!res.ok) return null;
  return res.json();
}
```

### 4.2 Add context endpoint in garden controller

```typescript
@Get('plants/:plantId/chat-context')
@UseGuards(JwtAuthGuard)
async getChatContext(
  @CurrentUser() user: { id: string },
  @Param('plantId') plantId: string,
) {
  return this.gardenService.buildEnhancedPlantContext(plantId, user.id);
}
```

---

## Step 5: Chat UI Enhancements

### 5.1 Message grouping by date

Group messages by date headers:

```typescript
function groupMessagesByDate(messages: ChatMessage[]) {
  const groups: { date: string; messages: ChatMessage[] }[] = [];
  let currentDate = '';

  for (const msg of messages) {
    const date = new Date(msg.createdAt).toLocaleDateString();
    if (date !== currentDate) {
      currentDate = date;
      groups.push({ date, messages: [msg] });
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  }

  return groups;
}
```

### 5.2 Auto-scroll to bottom on history load

```typescript
const messagesEndRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (!loadingHistory && messages.length > 0) {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }
}, [loadingHistory, messages.length]);
```

### 5.3 Conversation metadata

Show plant name and status in chat header:
```typescript
// In chatbot layout header
<span>{plant?.nickname} - {plant?.status}</span>
```

---

## Files Changed

| File | Change |
|------|--------|
| `apps/api/src/app.service.ts` | Add `getConversationHistory`, enhance `buildEnhancedPlantContext` |
| `apps/api/src/app.controller.ts` | Add `GET /api/chat/conversation/:plantId` |
| `apps/api/src/garden/garden.service.ts` | Add `buildEnhancedPlantContext` method |
| `apps/api/src/garden/garden.controller.ts` | Add `GET plants/:plantId/chat-context` |
| `apps/web/lib/useConversationHistory.ts` | New: conversation history hook |
| `apps/web/lib/plant-chat-context.ts` | Enhance context builder |
| `apps/web/components/chatbot/ChatbotScreen.tsx` | Load history on mount, track conversationId, date grouping |

---

## Testing Checklist

- [ ] Conversation loads on ChatbotScreen mount
- [ ] Previous messages displayed correctly
- [ ] New messages appended to existing conversation
- [ ] conversationId tracked across sessions
- [ ] Enhanced journal data included in AI responses
- [ ] Skeleton shown during history load
- [ ] Messages scroll to bottom on load
- [ ] Date headers between message groups
- [ ] Works with no prior conversation (empty state)
- [ ] Handles 50+ message conversations
