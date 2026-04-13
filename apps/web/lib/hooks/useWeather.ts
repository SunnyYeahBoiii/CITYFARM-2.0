"use client";

import { useEffect, useState } from "react";

export interface WeatherData {
  temperature: number;
  humidity: number;
  condition: string;
  icon: string;
}

type WeatherState =
  | { status: "loading" }
  | { status: "success"; data: WeatherData }
  | { status: "error"; message: string };

const WMO_CODES: Record<number, { condition: string; icon: string }> = {
  0: { condition: "Trời quang", icon: "\u2600\uFE0F" },
  1: { condition: "Ít mây", icon: "\uD83C\uDF24\uFE0F" },
  2: { condition: "Nhiều mây", icon: "\u26C5" },
  3: { condition: "U ám", icon: "\u2601\uFE0F" },
  45: { condition: "Sương mù", icon: "\uD83C\uDF2B\uFE0F" },
  48: { condition: "Sương muối", icon: "\uD83C\uDF2B\uFE0F" },
  51: { condition: "Mưa phùn nhẹ", icon: "\uD83C\uDF27\uFE0F" },
  53: { condition: "Mưa phùn", icon: "\uD83C\uDF27\uFE0F" },
  55: { condition: "Mưa phùn dày", icon: "\uD83C\uDF27\uFE0F" },
  61: { condition: "Mưa nhẹ", icon: "\uD83C\uDF27\uFE0F" },
  63: { condition: "Mưa", icon: "\uD83C\uDF27\uFE0F" },
  65: { condition: "Mưa lớn", icon: "\u26C8\uFE0F" },
  80: { condition: "Mưa rào nhẹ", icon: "\uD83C\uDF26\uFE0F" },
  81: { condition: "Mưa rào", icon: "\uD83C\uDF26\uFE0F" },
  82: { condition: "Mưa rào lớn", icon: "\u26C8\uFE0F" },
  95: { condition: "Dông", icon: "\u26C8\uFE0F" },
  96: { condition: "Dông có mưa đá", icon: "\u26C8\uFE0F" },
  99: { condition: "Dông lớn có mưa đá", icon: "\u26C8\uFE0F" },
};

function getWeatherInfo(code: number) {
  return WMO_CODES[code] ?? { condition: "Không xác định", icon: "\uD83C\uDF10" };
}

let cachedData: WeatherData | null = null;

export function useWeather() {
  const [state, setState] = useState<WeatherState>({ status: "loading" });

  useEffect(() => {
    if (cachedData) {
      setState({ status: "success", data: cachedData });
      return;
    }

    if (!navigator.geolocation) {
      setState({ status: "error", message: "Trình duyệt không hỗ trợ định vị" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`,
          );

          if (!res.ok) throw new Error("Không thể lấy dữ liệu thời tiết");

          const json = await res.json();
          const current = json.current;
          const info = getWeatherInfo(current.weather_code);

          const data: WeatherData = {
            temperature: Math.round(current.temperature_2m),
            humidity: current.relative_humidity_2m,
            condition: info.condition,
            icon: info.icon,
          };

          cachedData = data;
          setState({ status: "success", data });
        } catch {
          setState({ status: "error", message: "Không thể kết nối weather API" });
        }
      },
      () => {
        setState({ status: "error", message: "Vui lòng cho phép truy cập vị trí" });
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }, []);

  return state;
}
