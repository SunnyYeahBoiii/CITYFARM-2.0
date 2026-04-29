# Research: JSON Tool Calling Flow for Chatbot

## Research Question
How the current chatbot tool-calling pipeline works, and where to add support for JSON-formatted tool calls in system prompt so backend can parse and execute tools before returning a final response without tool-call payload.

## Current Architecture

### Request path
- `apps/web/components/chatbot/ChatbotScreen.tsx` sends chat input via `postChat`.
- `apps/web/lib/chat-api.ts` posts to Next route `POST /api/chat`.
- `apps/web/app/api/chat/route.ts` validates input and forwards to NestJS `POST /api/chat`.
- `apps/api/src/app.controller.ts` delegates to `AppService.handleChatRequest`.
- `apps/api/src/app.service.ts` builds RAG context and calls `ModelApiService.getChatAdvice`.
- `apps/api/src/ai/model-api.service.ts` forwards payload to Python `apps/model-api/src/main.py` endpoint `POST /api/chat`.

### Existing tool-calling mechanism
- Tool metadata is defined in `apps/api/src/ai/tool-definitions.ts` (`TOOL_DEFINITIONS`).
- `AppService.processChatRequest` passes `TOOL_DEFINITIONS` to model-api.
- Python builds Gemini function declarations from `tools` and sends them via SDK `GenerateContentConfig(..., tools=[...])`.
- When Gemini returns function calls, Python returns:
  - `success: true`
  - `tool_calls: [{ id, name, arguments }]`
  - `reply: null`
- NestJS executes each tool call through `ToolExecutorService` in `apps/api/src/ai/tool-executor.service.ts`.
- NestJS sends `tool_results` back to model-api in a second call, then updates `reply` from the second response.

### Existing response shape to frontend
- NestJS currently returns `conversationId` plus full AI response and `toolCalls`.
- Frontend `ChatbotScreen` checks `toolCalls` for `create_care_task` and renders confirmation UI (`TaskPreviewCard`).

## Data Contracts Observed

### Tool declaration payload (NestJS -> Python)
- Top-level key: `tools`
- Tool fields: `name`, `description`, `parameters` (`type`, `properties`, `required`).

### Tool call payload (Python -> NestJS)
- Top-level key: `tool_calls`
- Per item: `id`, `name`, `arguments`.

### Tool result payload (NestJS -> Python)
- Top-level key: `tool_results`
- Per item: `tool_call_id`, `success`, `result`, `error`.

## System Prompt Construction Today
- Built in `apps/model-api/src/main.py` in `chat_with_assistant`.
- Prompt combines:
  - user profile
  - species data
  - current plant data
  - recent history
  - optional tool instruction block and serialized tool definitions
- Current prompt includes "plain text response" rule.

## Integration Points For JSON Tool Calling
- `apps/model-api/src/main.py`:
  - Extend system prompt with strict JSON tool-call output format.
  - Include available tools and argument schema directly in prompt text.
- `apps/api/src/app.service.ts`:
  - Parse AI `reply` when it contains JSON tool-call envelope.
  - Convert parsed JSON into internal `ToolCall[]`.
  - Reuse existing `ToolExecutorService` execution and second-pass final answer flow.
  - Return final response without exposing `toolCalls`.
- `apps/web/lib/chat-api.ts` and `apps/web/components/chatbot/ChatbotScreen.tsx`:
  - Keep compatible with response that may omit `toolCalls`.

## Relevant Files
- `apps/api/src/app.service.ts`
- `apps/api/src/ai/model-api.service.ts`
- `apps/api/src/ai/tool-definitions.ts`
- `apps/api/src/ai/tool-executor.service.ts`
- `apps/model-api/src/main.py`
- `apps/web/lib/chat-api.ts`
- `apps/web/components/chatbot/ChatbotScreen.tsx`
- `apps/web/app/api/chat/route.ts`
