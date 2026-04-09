import { NextResponse } from "next/server";

function nestBaseUrl(): string {
  const raw = process.env.NEST_API_URL ?? "http://127.0.0.1:3001";
  return raw.replace(/\/$/, "");
}

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

  try {
    const upstream = await fetch(`${nestBaseUrl()}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data: unknown = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json(
      { success: false, error: "Không kết nối được tới API. Kiểm tra NEST_API_URL và server NestJS." },
      { status: 502 },
    );
  }
}
