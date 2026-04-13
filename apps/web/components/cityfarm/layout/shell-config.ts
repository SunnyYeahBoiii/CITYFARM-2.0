import type { ComponentType } from "react";
import { BagIcon, CameraIcon, HomeIcon, SproutIcon, UsersIcon } from "../shared/icons";

export type ShellVariant = "tabs" | "detail" | "chat";
export type HeaderOptions = {
  chatPlantId?: string | null;
};

export type HeaderConfig = {
  title: string;
  subtitle: string;
  backHref?: string;
};

export const tabItems: Array<{
  href: string;
  label: string;
  Icon: ComponentType;
}> = [
  { href: "/home", label: "Home", Icon: HomeIcon },
  { href: "/order", label: "Shop", Icon: BagIcon },
  { href: "/scan", label: "Scan", Icon: CameraIcon },
  { href: "/garden", label: "Garden", Icon: SproutIcon },
  { href: "/community", label: "Social", Icon: UsersIcon },
];

export function resolveHeader(
  pathname: string,
  variant: ShellVariant,
  options?: HeaderOptions,
): HeaderConfig {
  if (pathname.startsWith("/chatbot")) {
    const plantId = options?.chatPlantId?.trim();
    return {
      title: "CityFarm AI",
      subtitle: "Chăm cây, đất, nước, sâu bệnh — gợi ý theo ngữ cảnh vườn bạn.",
      backHref: plantId ? `/garden/${encodeURIComponent(plantId)}` : "/home",
    };
  }

  if (pathname.startsWith("/garden/")) {
    return {
      title: variant === "detail" ? "Plant Detail" : "My Garden",
      subtitle:
        variant === "detail"
          ? "Track growth, care, and journal updates."
          : "Track care, harvest pace, and active kits.",
      backHref: "/garden",
    };
  }

  if (pathname.startsWith("/community/shared/")) {
    return {
      title: "Shared Plant",
      subtitle: "Inspect the shared plant history in a read-only view.",
      backHref: "/community",
    };
  }

  if (pathname.startsWith("/garden")) {
    return {
      title: "My Garden",
      subtitle: "Track care, harvest pace, and active kits.",
    };
  }

  if (pathname.startsWith("/community")) {
    return {
      title: "Community",
      subtitle: "Social feed and fresh market in one place.",
    };
  }

  if (pathname.startsWith("/order")) {
    return {
      title: "Shop",
      subtitle: "Starter kits, seeds, soil, and recycled pots.",
    };
  }

  if (pathname.startsWith("/scan")) {
    return {
      title: "Scan Your Space",
      subtitle: "Capture, analyze, recommend, and visualize.",
    };
  }

  return {
    title: "CITYFARM",
    subtitle: "Grow clean, live green from any urban corner.",
  };
}

export function isActive(pathname: string, href: string) {
  if (href === "/home") {
    return pathname === "/home";
  }

  if (href === "/scan") {
    return pathname === "/scan";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
