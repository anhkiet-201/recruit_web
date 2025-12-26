export interface GeminiFunctionDeclaration {
  name: string;
  description: string;
  parameters?: Record<string, any>;
}

export interface GeminiTool {
  functionDeclarations: GeminiFunctionDeclaration[];
}

export interface GeminiFunctionCall {
  name: string;
  args: Record<string, any>;
}

export interface GeminiPart {
  text?: string;
  functionCall?: GeminiFunctionCall;
}

export interface GeminiContent {
  role?: string;
  parts: GeminiPart[];
}

export interface GeminiCandidate {
  content?: GeminiContent;
}

export interface GeminiResponse {
  text?: string | (() => string);
  functionCalls?: any[] | (() => any[]);
  candidates?: GeminiCandidate[];
}

export interface GeminiChatConfig {
  systemInstruction?: { parts: { text: string }[] };
  generationConfig?: {
    maxOutputTokens: number;
    temperature: number;
  };
  tools?: GeminiTool[];
}
