import { Injectable, OnModuleInit } from '@nestjs/common';
import { IAiProvider, AiResponse } from '../interfaces/ai-provider.interface';

/**
 * Implementation của IAiProvider sử dụng Google Gemini (thông qua SDK @google/genai).
 * Hỗ trợ:
 * - Text Generation (Chat)
 * - Vector Embedding (text-embedding-004)
 * - Function Calling (Tools)
 */
@Injectable()
export class GeminiProvider implements IAiProvider, OnModuleInit {
  private client: any;
  private embeddingModel: string;
  private chatModel: string;

  /**
   * Khởi tạo kết nối với Google GenAI SDK.
   * Sử dụng Dynamic Import vì SDK này là ESM-only module.
   */
  async onModuleInit() {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
      console.warn('AI_API_KEY is missing in environment variables.');
    }

    try {
      const { GoogleGenAI } = await import("@google/genai");
      this.client = new GoogleGenAI({
        apiKey: apiKey || '',
      });
    } catch (error) {
      console.error("Failed to load GoogleGenAI SDK:", error);
    }

    this.embeddingModel = (process.env.AI_EMBEDDING_MODEL || "text-embedding-004").trim();
    this.chatModel = (process.env.AI_CHAT_MODEL || "gemini-2.0-flash-exp").trim();
  }

  /**
   * Tạo Vector Embedding từ văn bản.
   * Dùng để so sánh độ tương đồng ngữ nghĩa.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.client) throw new Error("AI Provider not initialized");
    const result = await this.client.models.embedContent({
      model: this.embeddingModel,
      contents: [text]
    });
    return result.embeddings?.[0]?.values || [];
  }

  /**
   * Tạo văn bản đơn giản (One-shot generation).
   */
  async generateText(prompt: string): Promise<string> {
    if (!this.client) throw new Error("AI Provider not initialized");
    const result = await this.client.models.generateContent({
      model: this.chatModel,
      contents: [prompt]
    });
    return result.text || "";
  }

  /**
   * Xử lý hội thoại Chat với đầy đủ ngữ cảnh và công cụ.
   * 
   * @param systemInstruction Hướng dẫn hệ thống (Persona, Rules).
   * @param history Lịch sử chat (đã được map sang format của Gemini).
   * @param message Tin nhắn mới nhất của người dùng.
   * @param tools Danh sách công cụ (Function Declarations) mà AI có thể gọi.
   */
  async chat(
    systemInstruction: string,
    history: { role: string; parts: string }[],
    message: string,
    tools?: any[]
  ): Promise<AiResponse> {
    if (!this.client) throw new Error("AI Provider not initialized");

    // 1. Cấu hình (Configuration)
    const chatConfig: any = {
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0
      },
    };

    // Chỉ gắn tools nếu có định nghĩa
    if (tools && tools.length > 0) {
      chatConfig.tools = [{ functionDeclarations: tools }];
    }

    // 2. Chuẩn bị Lịch sử (Map roles)
    // Gemini dùng 'model' cho bot, trong khi app dùng 'assistant'.
    const formattedHistory = history.map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.parts }]
    }));

    // 3. Khởi tạo phiên Chat
    const chat = this.client.chats.create({
      model: this.chatModel,
      history: formattedHistory,
      config: chatConfig, 
    });

    try {
      if (!message || message.trim() === '') {
          throw new Error("Message content cannot be empty");
      }

      // 4. Gửi tin nhắn
      const result = await chat.sendMessage({ message: message });

      // 5. Xử lý phản hồi (Safe Parsing)
      // Do SDK @google/genai có thể thay đổi cấu trúc trả về, ta cần kiểm tra kỹ.
      let text = "";
      let functionCalls: any[] = [];

      // Kiểm tra Function Call (Hỗ trợ cả dạng hàm và dạng thuộc tính)
      if (typeof result.functionCalls === 'function') {
        const calls = result.functionCalls();
        if (Array.isArray(calls)) functionCalls = calls;
      } else if (Array.isArray(result.functionCalls)) {
        functionCalls = result.functionCalls;
      } else if (Array.isArray(result.candidates) && result.candidates.length > 0) {
        // Fallback: Kiểm tra thủ công trong candidates nếu method trên không trả về dữ liệu
        const parts = result.candidates[0]?.content?.parts || [];
        const fcPart = parts.find((p: any) => p.functionCall);
        if (fcPart) {
            functionCalls = [fcPart.functionCall];
        }
      }

      // Trích xuất Text
      try {
        if (typeof result.text === 'function') {
             text = result.text();
        } else if (typeof result.text === 'string') {
             text = result.text;
        } else if (result.candidates && result.candidates[0]?.content?.parts) {
             text = result.candidates[0].content.parts.map((p: any) => p.text).join('');
        }
      } catch (e) {
          if (functionCalls.length === 0) console.warn("Gemini: Could not extract text", e);
      }

      // Trả về kết quả
      if (functionCalls.length > 0) {
        return {
          text: text || "",
          toolCall: {
            name: functionCalls[0].name,
            args: functionCalls[0].args
          }
        };
      }

      return { text: text };

    } catch (error) {
      console.error("Gemini Chat Critical Error:", error);
      return { text: "Xin lỗi, hệ thống AI đang gặp sự cố kết nối." };
    }
  }
}
