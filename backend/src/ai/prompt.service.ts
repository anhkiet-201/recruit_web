import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PromptService {
    private readonly logger = new Logger(PromptService.name);
    private readonly promptDir = path.join(process.cwd(), 'src/ai/prompts');

    constructor() {
        this.ensurePromptDir();
    }

    private ensurePromptDir() {
        if (!fs.existsSync(this.promptDir)) {
            try {
                fs.mkdirSync(this.promptDir, { recursive: true });
            } catch (e) {
                this.logger.error(`Failed to create prompt directory: ${this.promptDir}`, e);
            }
        }
    }

    async getPrompt(templateName: string, variables: Record<string, string> = {}): Promise<string> {
        try {
            const filePath = path.join(this.promptDir, `${templateName}.md`);

            if (!fs.existsSync(filePath)) {
                this.logger.warn(`Prompt template not found: ${templateName}`);
                return '';
            }

            let content = await fs.promises.readFile(filePath, 'utf-8');

            // Simple template interpolation
            // Replaces {{KEY}} with value from variables
            for (const [key, value] of Object.entries(variables)) {
                const regex = new RegExp(`{{${key}}}`, 'g');
                content = content.replace(regex, value);
            }

            return content;
        } catch (error) {
            this.logger.error(`Error loading prompt ${templateName}:`, error);
            throw error;
        }
    }
}
