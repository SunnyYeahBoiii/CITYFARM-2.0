import { format } from "date-fns";

export function formatDateTime(date: string | Date | number, formatStr: string = "dd MMM, HH:mm"): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, formatStr);
}

export function formatDateShort(date: string | Date | number): string {
  return formatDateTime(date, "dd MMM");
}
