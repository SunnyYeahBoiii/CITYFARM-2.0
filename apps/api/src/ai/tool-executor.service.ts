import { Injectable } from '@nestjs/common';
import { GardenService } from '../garden/garden.service';
import { PrismaService } from '../prisma/prisma.service';
import { ToolCall, ToolResult } from './tool-definitions';

@Injectable()
export class ToolExecutorService {
  constructor(
    private readonly gardenService: GardenService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(toolCall: ToolCall, userId: string): Promise<ToolResult> {
    switch (toolCall.name) {
      case 'create_care_task':
        return this.executeCreateTask(toolCall, userId);
      case 'log_journal_entry':
        return this.executeLogJournal(toolCall, userId);
      case 'get_pending_tasks':
        return this.executeGetPendingTasks(toolCall, userId);
      default:
        return {
          toolCallId: toolCall.id,
          success: false,
          error: `Unknown tool: ${toolCall.name}`,
        };
    }
  }

  private async executeCreateTask(
    toolCall: ToolCall,
    userId: string,
  ): Promise<ToolResult> {
    const { plantId, taskType, title, dueAt, notes } = toolCall.arguments;

    if (
      typeof plantId !== 'string' ||
      typeof taskType !== 'string' ||
      typeof title !== 'string'
    ) {
      return {
        toolCallId: toolCall.id,
        success: false,
        error: 'Missing required parameters: plantId, taskType, or title',
      };
    }

    try {
      const task = await this.gardenService.createCareTask(userId, plantId, {
        taskType,
        title,
        dueAt: typeof dueAt === 'string' ? dueAt : undefined,
        notes: typeof notes === 'string' ? notes : undefined,
      });

      return {
        toolCallId: toolCall.id,
        success: true,
        result: {
          id: task.id,
          taskType: task.taskType,
          title: task.title,
          dueAt: task.dueAt,
          status: task.status,
          createdBy: task.createdBy,
        },
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to create task';
      return {
        toolCallId: toolCall.id,
        success: false,
        error: message,
      };
    }
  }

  private async executeLogJournal(
    toolCall: ToolCall,
    userId: string,
  ): Promise<ToolResult> {
    const { plantId, note, healthStatus, issueSummary } = toolCall.arguments;

    if (
      typeof plantId !== 'string' ||
      typeof note !== 'string' ||
      typeof healthStatus !== 'string'
    ) {
      return {
        toolCallId: toolCall.id,
        success: false,
        error: 'Missing required parameters: plantId, note, or healthStatus',
      };
    }

    try {
      const entry = await this.gardenService.logJournalEntry(userId, plantId, {
        note,
        healthStatus,
        issueSummary: typeof issueSummary === 'string' ? issueSummary : undefined,
      });

      return {
        toolCallId: toolCall.id,
        success: true,
        result: {
          id: entry.id,
          note: entry.note,
          healthStatus: entry.healthStatus,
          capturedAt: entry.capturedAt,
        },
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to log journal entry';
      return {
        toolCallId: toolCall.id,
        success: false,
        error: message,
      };
    }
  }

  private async executeGetPendingTasks(
    toolCall: ToolCall,
    userId: string,
  ): Promise<ToolResult> {
    const { plantId } = toolCall.arguments;

    if (typeof plantId !== 'string') {
      return {
        toolCallId: toolCall.id,
        success: false,
        error: 'Missing required parameter: plantId',
      };
    }

    try {
      // Verify plant ownership
      const plant = await this.prisma.gardenPlant.findUnique({
        where: { id: plantId, userId },
      });

      if (!plant) {
        return {
          toolCallId: toolCall.id,
          success: false,
          error: 'Plant not found or not owned by user',
        };
      }

      const tasks = await this.prisma.careTask.findMany({
        where: {
          gardenPlantId: plantId,
          status: 'PENDING',
        },
        orderBy: { dueAt: 'asc' },
        select: {
          id: true,
          taskType: true,
          title: true,
          dueAt: true,
          description: true,
        },
      });

      return {
        toolCallId: toolCall.id,
        success: true,
        result: tasks.map((t) => ({
          id: t.id,
          taskType: t.taskType,
          title: t.title,
          dueAt: t.dueAt?.toISOString() ?? null,
          description: t.description,
        })),
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to get pending tasks';
      return {
        toolCallId: toolCall.id,
        success: false,
        error: message,
      };
    }
  }
}