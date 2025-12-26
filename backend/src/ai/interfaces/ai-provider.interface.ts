export interface AiResponse {
  text?: string;
  toolCall?: {
    name: string;
    args: any;
  };
}

export abstract class IAiProvider {
  /** Tạo Vector Embedding */
  abstract generateEmbedding(text: string): Promise<number[]>;

  /** Tạo Text đơn giản */
  abstract generateText(prompt: string): Promise<string>;

  /** Chat với lịch sử và Tools */
  abstract chat(
    systemInstruction: string,
    history: { role: string; parts: string }[],
    message: string,
    tools?: any[],
  ): Promise<AiResponse>;
}

export const AI_PROVIDER_TOKEN = 'AI_PROVIDER_TOKEN';
