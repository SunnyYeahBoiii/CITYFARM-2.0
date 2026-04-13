"use client";

import { useWeather } from "../../../lib/hooks/useWeather";
import { DropletIcon } from "../shared/icons";

export function WeatherWidget() {
  const weather = useWeather();

  if (weather.status === "loading") {
    return (
      <section className="mt-4 rounded-[1.25rem] border border-[color:rgba(31,41,22,0.08)] bg-white p-4 shadow-[0_8px_20px_rgba(33,49,30,0.06)]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--color-screen)]" />
          <div className="flex-1">
            <div className="h-4 w-20 animate-pulse rounded bg-[var(--color-screen)]" />
            <div className="mt-1.5 h-3 w-32 animate-pulse rounded bg-[var(--color-screen)]" />
          </div>
        </div>
      </section>
    );
  }

  if (weather.status === "error") {
    return (
      <section className="mt-4 rounded-[1.25rem] border border-[color:rgba(31,41,22,0.08)] bg-white p-4 shadow-[0_8px_20px_rgba(33,49,30,0.06)]">
        <div className="flex items-center gap-3 text-xs text-[var(--color-muted)]">
          <span className="text-sm">📍</span>
          <span>{weather.message}</span>
        </div>
      </section>
    );
  }

  const { temperature, humidity, condition, icon } = weather.data;

  return (
    <section className="mt-4 rounded-[1.25rem] border border-[color:rgba(31,41,22,0.08)] bg-white p-4 shadow-[0_8px_20px_rgba(33,49,30,0.06)]">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-amber-50 to-sky-50 text-xl">
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-extrabold text-[var(--color-heading)]">{temperature}°C</span>
            <span className="text-sm font-semibold text-[var(--color-muted)]">{condition}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--color-muted)]">
            <DropletIcon />
            <span>Độ ẩm {humidity}%</span>
          </div>
        </div>
      </div>
    </section>
  );
}
