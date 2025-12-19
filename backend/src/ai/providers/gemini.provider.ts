import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { IAiProvider } from '../interfaces/ai-provider.interface';

@Injectable()
export class GeminiProvider implements IAiProvider {
  private genAI: GoogleGenerativeAI;
  private embeddingModel: string;
  private chatModel: string;

  constructor() {
    const apiKey = process.env.AI_API_KEY;
    // Làm sạch tên model (xóa khoảng trắng thừa)
    this.embeddingModel = (process.env.AI_EMBEDDING_MODEL || "text-embedding-004").trim();
    this.chatModel = (process.env.AI_CHAT_MODEL || "gemini-1.5-flash").trim();

    if (!apiKey) {
      console.error('AI_API_KEY is not defined in environment variables.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey || '');
  }

  getChatModel(systemInstruction?: string) {
    return this.genAI.getGenerativeModel({ 
      model: this.chatModel,
      systemInstruction: systemInstruction 
    });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const model = this.genAI.getGenerativeModel({ model: this.embeddingModel });
    const result = await model.embedContent(text);
    return result.embedding.values;
  }

  async generateText(prompt: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: this.chatModel });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}
