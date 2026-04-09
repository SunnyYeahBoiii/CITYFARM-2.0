import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  async getAIAdvice(payload: any) {
    try {
      // Gọi xuống Backend Python qua mạng LAN ảo của Docker
      const modelBase = (process.env.MODEL_API_URL ?? "http://model-api:3002").replace(/\/$/, "");
      const response = await fetch(`${modelBase}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error("Lỗi khi gọi Python Model API:", error);
      return { success: false, error: "Cannot connect to AI Model" };
    }
  }
}