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
      case 'update_care_task':
        return this.executeUpdateTask(toolCall, userId);
      case 'delete_care_task':
        return this.executeDeleteTask(toolCall, userId);
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
    const { plantId, taskType, title, dueAt, notes, journalImageAssetId } =
      toolCall.arguments;

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

      const dailyJournal =
        await this.gardenService.appendTaskHistoryToDailyJournal(
          userId,
          plantId,
          {
            action: 'CREATED',
            taskId: task.id,
            title: task.title,
            taskType: task.taskType,
            changes: {
              dueAt: task.dueAt?.toISOString() ?? null,
              notes: task.description ?? null,
            },
            imageAssetId:
              typeof journalImageAssetId === 'string'
                ? journalImageAssetId
                : undefined,
          },
        );

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
          dailyJournalId: dailyJournal.id,
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
    const { plantId, note, healthStatus, issueSummary, imageAssetId } =
      toolCall.arguments;

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
        issueSummary:
          typeof issueSummary === 'string' ? issueSummary : undefined,
        imageAssetId:
          typeof imageAssetId === 'string' ? imageAssetId : undefined,
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

  private async executeUpdateTask(
    toolCall: ToolCall,
    userId: string,
  ): Promise<ToolResult> {
    const { taskId, taskType, title, dueAt, notes, journalImageAssetId } =
      toolCall.arguments;

    if (typeof taskId !== 'string') {
      return {
        toolCallId: toolCall.id,
        success: false,
        error: 'Missing required parameter: taskId',
      };
    }

    try {
      const task = await this.prisma.careTask.findFirst({
        where: {
          id: taskId,
          gardenPlant: { userId },
        },
        select: {
          id: true,
          gardenPlantId: true,
          status: true,
          taskType: true,
          title: true,
          description: true,
          dueAt: true,
        },
      });

      if (!task) {
        return {
          toolCallId: toolCall.id,
          success: false,
          error: 'Task not found or not owned by user',
        };
      }

      if (task.status !== 'PENDING') {
        return {
          toolCallId: toolCall.id,
          success: false,
          error: 'Only PENDING tasks can be updated',
        };
      }

      const data: Record<string, unknown> = {};
      if (typeof taskType === 'string') data.taskType = taskType;
      if (typeof title === 'string') data.title = title;
      if (typeof notes === 'string') data.description = notes;
      if (typeof dueAt === 'string') {
        const parsedDueAt = new Date(dueAt);
        if (Number.isNaN(parsedDueAt.getTime())) {
          return {
            toolCallId: toolCall.id,
            success: false,
            error: 'Invalid dueAt format. Expected ISO date-time string.',
          };
        }
        data.dueAt = parsedDueAt;
      }

      if (Object.keys(data).length === 0) {
        return {
          toolCallId: toolCall.id,
          success: false,
          error: 'No updatable fields provided',
        };
      }

      const updated = await this.prisma.careTask.update({
        where: { id: taskId },
        data,
        select: {
          id: true,
          taskType: true,
          title: true,
          description: true,
          dueAt: true,
          status: true,
        },
      });

      const linkedJournal =
        await this.gardenService.appendTaskHistoryToDailyJournal(
          userId,
          task.gardenPlantId,
          {
            action: 'UPDATED',
            taskId: updated.id,
            title: updated.title,
            taskType: updated.taskType,
            changes: {
              before: {
                taskType: task.taskType,
                title: task.title,
                notes: task.description,
                dueAt: task.dueAt?.toISOString() ?? null,
              },
              after: {
                taskType: updated.taskType,
                title: updated.title,
                notes: updated.description,
                dueAt: updated.dueAt?.toISOString() ?? null,
              },
            },
            imageAssetId:
              typeof journalImageAssetId === 'string'
                ? journalImageAssetId
                : undefined,
          },
        );

      return {
        toolCallId: toolCall.id,
        success: true,
        result: {
          id: updated.id,
          taskType: updated.taskType,
          title: updated.title,
          notes: updated.description,
          dueAt: updated.dueAt?.toISOString() ?? null,
          status: updated.status,
          dailyJournalId: linkedJournal.id,
        },
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to update task';
      return {
        toolCallId: toolCall.id,
        success: false,
        error: message,
      };
    }
  }

  private async executeDeleteTask(
    toolCall: ToolCall,
    userId: string,
  ): Promise<ToolResult> {
    const { taskId, journalImageAssetId } = toolCall.arguments;

    if (typeof taskId !== 'string') {
      return {
        toolCallId: toolCall.id,
        success: false,
        error: 'Missing required parameter: taskId',
      };
    }

    try {
      const task = await this.prisma.careTask.findFirst({
        where: {
          id: taskId,
          gardenPlant: { userId },
        },
        select: {
          id: true,
          gardenPlantId: true,
          status: true,
          title: true,
          taskType: true,
        },
      });

      if (!task) {
        return {
          toolCallId: toolCall.id,
          success: false,
          error: 'Task not found or not owned by user',
        };
      }

      if (task.status !== 'PENDING') {
        return {
          toolCallId: toolCall.id,
          success: false,
          error: 'Only PENDING tasks can be deleted',
        };
      }

      await this.prisma.careTask.delete({
        where: { id: task.id },
      });

      const linkedJournal =
        await this.gardenService.appendTaskHistoryToDailyJournal(
          userId,
          task.gardenPlantId,
          {
            action: 'DELETED',
            taskId: task.id,
            title: task.title,
            taskType: task.taskType,
            changes: {
              status: 'PENDING',
            },
            imageAssetId:
              typeof journalImageAssetId === 'string'
                ? journalImageAssetId
                : undefined,
          },
        );

      return {
        toolCallId: toolCall.id,
        success: true,
        result: {
          deleted: true,
          id: task.id,
          title: task.title,
          taskType: task.taskType,
          dailyJournalId: linkedJournal.id,
        },
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to delete task';
      return {
        toolCallId: toolCall.id,
        success: false,
        error: message,
      };
    }
  }
}
