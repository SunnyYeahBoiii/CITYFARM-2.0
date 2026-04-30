"use client";

import { Check, X, Calendar, Clock } from "lucide-react";

type TaskPreviewCardProps = {
  taskType: string;
  data: {
    title: string;
    taskType: string;
    dueAt?: string | null;
    notes?: string;
  };
  onConfirm: () => void;
  onReject: () => void;
  loading?: boolean;
};

const TASK_TYPE_LABELS: Record<string, string> = {
  WATERING: "Tưới nước",
  FERTILIZING: "Bón phân",
  PRUNING: "Tỉa lá",
  ROTATING: "Xoay cây",
  PEST_CHECK: "Kiểm tra sâu bệnh",
  HARVEST: "Thu hoạch",
  CUSTOM: "Tùy chỉnh",
};

const TASK_TYPE_COLORS: Record<string, string> = {
  WATERING: "bg-blue-50 border-blue-200 text-blue-700",
  FERTILIZING: "bg-amber-50 border-amber-200 text-amber-700",
  PRUNING: "bg-green-50 border-green-200 text-green-700",
  ROTATING: "bg-purple-50 border-purple-200 text-purple-700",
  PEST_CHECK: "bg-red-50 border-red-200 text-red-700",
  HARVEST: "bg-orange-50 border-orange-200 text-orange-700",
  CUSTOM: "bg-gray-50 border-gray-200 text-gray-700",
};

export function TaskPreviewCard({
  taskType,
  data,
  onConfirm,
  onReject,
  loading = false,
}: TaskPreviewCardProps) {
  const typeLabel = TASK_TYPE_LABELS[taskType] || taskType;
  const typeColorClass =
    TASK_TYPE_COLORS[taskType] || "bg-gray-50 border-gray-200 text-gray-700";

  const dueDate = data.dueAt
    ? new Date(data.dueAt).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "Hôm nay";

  const dueTime = data.dueAt
    ? new Date(data.dueAt).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div
      className={`rounded-lg border-2 p-3 shadow-sm ${typeColorClass} border-l-4`}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide opacity-80">
          AI đề xuất task:
        </span>
        <span className="rounded-full bg-white/60 px-2 py-0.5 text-xs font-semibold">
          {typeLabel}
        </span>
      </div>

      <div className="mb-2">
        <p className="text-sm font-semibold leading-snug">{data.title}</p>
        {data.notes ? (
          <p className="mt-1 text-xs leading-snug opacity-80">{data.notes}</p>
        ) : null}
      </div>

      <div className="mb-3 flex items-center gap-3 text-xs opacity-80">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>{dueDate}</span>
        </div>
        {dueTime ? (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{dueTime}</span>
          </div>
        ) : null}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={onConfirm}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-white px-3 py-2 text-sm font-medium shadow-sm transition-all hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] disabled:opacity-50"
        >
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-green-700">Tạo task</span>
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={onReject}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-white px-3 py-2 text-sm font-medium shadow-sm transition-all hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] disabled:opacity-50"
        >
          <X className="h-4 w-4 text-gray-500" />
          <span className="text-gray-600">Bỏ qua</span>
        </button>
      </div>
    </div>
  );
}