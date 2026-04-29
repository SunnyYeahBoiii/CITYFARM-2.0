# Implementation Plan: JSON Tool Calling Through System Prompt

## Overview
Add JSON-based tool-calling instructions into chatbot system prompt, let model return tool calls as JSON text, parse/execute those calls in backend, then return final assistant response without exposing tool-call payload to client.

## Current State
- Gemini native function-calling is already wired in Python model-api.
- NestJS already has `ToolExecutorService` and second-pass completion flow using `tool_results`.
- Frontend currently can consume `toolCalls`, but normal reply-only path also exists.

## Desired End State
- System prompt always includes available tool list + strict JSON output contract for tool calls.
- First model response can return JSON envelope in `reply`, not native `tool_calls`.
- NestJS parses JSON envelope from `reply`, executes tools, sends `tool_results`, and returns final reply.
- API response to frontend excludes `toolCalls`; only final assistant text + existing metadata is returned.

## Scope
- In scope:
  - prompt contract for JSON tool calling
  - backend parser and orchestration
  - response shaping to hide tool calls
- Out of scope:
  - redesigning frontend confirmation UI
  - adding new tools
  - changing database schema

## Phase 1: Prompt and Output Contract

### Files
- `apps/model-api/src/main.py`

### Changes
- Add explicit tool-calling JSON schema instructions in system prompt:
  - available tools with parameters
  - required JSON-only envelope when tool execution is needed
- Add post-tool-result rule:
  - when `tool_results` is present, model must return final plain-text answer only.
- Stop depending on Gemini native function-calling output for this path and return `reply` text consistently.

### Success Criteria
- Automated:
  - [ ] `python -m py_compile apps/model-api/src/main.py`
- Manual:
  - [ ] Prompt includes serialized tool definitions.
  - [ ] A tool-requiring question can produce JSON tool-call text in `reply`.

## Phase 2: Backend JSON Tool-Call Parsing and Execution

### Files
- `apps/api/src/app.service.ts`

### Changes
- Add helper parser to extract JSON tool-call envelope from model `reply`.
- Convert parsed JSON to internal `ToolCall[]`.
- Reuse existing `ToolExecutorService.execute(...)` flow.
- Run second model call with `tool_results` to generate final response text.
- Return response without `toolCalls` field.

### Success Criteria
- Automated:
  - [ ] `pnpm --filter @cityfarm/api lint`
- Manual:
  - [ ] Tool-call JSON is parsed and executed by backend.
  - [ ] Final response no longer includes `toolCalls`.

## Phase 3: Client Contract Cleanup

### Files
- `apps/web/lib/chat-api.ts`
- `apps/web/components/chatbot/ChatbotScreen.tsx`

### Changes
- Ensure frontend works with reply-only API response (no `toolCalls` reliance required).
- Keep backward-tolerant types where needed.

### Success Criteria
- Automated:
  - [ ] `pnpm --filter @cityfarm/web lint`
- Manual:
  - [ ] Chat still renders assistant messages correctly with final response text.

## Verification Strategy
- Backend scenario:
  1. Send message that should trigger `create_care_task`.
  2. Confirm first model output is JSON tool-call text.
  3. Confirm backend executes tool and sends `tool_results`.
  4. Confirm second model output is natural language response.
  5. Confirm client receives final response without `toolCalls`.

- Non-tool scenario:
  1. Send normal advisory message.
  2. Confirm direct plain-text response is returned.
