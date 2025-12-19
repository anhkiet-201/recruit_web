export interface IAiProvider {
  /**
   * Chuyển văn bản thành vector số
   */
  generateEmbedding(text: string): Promise<number[]>;

  /**
   * Chat hoặc xử lý văn bản bằng AI
   */
  generateText(prompt: string): Promise<string>;

  /**
   * Lấy instance của chat model (Dành riêng cho các tính năng chat nâng cao)
   */
  getChatModel(systemInstruction?: string): any;
}

export const AI_PROVIDER_TOKEN = 'AI_PROVIDER_TOKEN';