import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-server";
import { buildNestApiUrl } from "@/lib/api/config";
import { isAuthenticated } from "@/lib/types/auth";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 });
  }

  const message = (body as { message?: unknown }).message;
  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ success: false, error: "Missing or invalid message" }, { status: 400 });
  }

  const rawPlantId = (body as { plantId?: unknown }).plantId;
  if (rawPlantId !== undefined && typeof rawPlantId !== "string") {
    return NextResponse.json({ success: false, error: "Invalid plantId" }, { status: 400 });
  }

  const payload = {
    ...(body as Record<string, unknown>),
    message: message.trim(),
    plantId: typeof rawPlantId === "string" && rawPlantId.trim() ? rawPlantId.trim() : undefined,
  };

  try {
    const upstreamHeaders = new Headers({ "Content-Type": "application/json" });
    const cookieHeader = request.headers.get("cookie");
    const user = await getUser();

    if (cookieHeader) {
      upstreamHeaders.set("cookie", cookieHeader);
    }
    if (isAuthenticated(user)) {
      upstreamHeaders.set("x-cityfarm-user-id", user.id);
    }

    const upstream = await fetch(buildNestApiUrl("/api/chat"), {
      method: "POST",
      headers: upstreamHeaders,
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data: unknown = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Không kết nối được tới NestJS. Kiểm tra NEST_API_URL và server API.",
      },
      { status: 502 },
    );
  }
}
