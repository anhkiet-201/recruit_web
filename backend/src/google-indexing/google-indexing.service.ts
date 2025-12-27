import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AuthClient, GoogleAuth } from 'google-auth-library';
import { google, indexing_v3 } from 'googleapis';
import * as path from 'path';
import * as fs from 'fs';

export type IndexingType = 'URL_UPDATED' | 'URL_DELETED';
export type Indexing = {
  url: string;
  type: IndexingType;
};

@Injectable()
export class GoogleIndexingService {
  private readonly logger = new Logger(GoogleIndexingService.name);
  private indexingClient: indexing_v3.Indexing;
  private auth: GoogleAuth<AuthClient>;

  constructor(private configService: ConfigService) {
    this.initGoogleClient();
  }

  private initGoogleClient() {
    // Check if env var is set (for flexibility), otherwise fallback to the file in root
    const keyFileName = 'gen-lang-client-0527244450-9920e4bcae01.json';
    const filePath = path.join(process.cwd(), keyFileName);

    if (!fs.existsSync(filePath)) {
      this.logger.warn(
        `Google Service Account file not found at ${filePath}. Google Indexing will be disabled.`,
      );
      return;
    }

    this.auth = new google.auth.GoogleAuth({
      keyFile: filePath,
      scopes: [
        'www.googleapis.com',
        'https://www.googleapis.com/auth/indexing',
      ],
    });

    this.indexingClient = google.indexing({
      version: 'v3',
      auth: this.auth,
    });
  }

  async publishUrl(indexing: Indexing): Promise<void> {
    if (!this.indexingClient) {
      this.logger.warn(
        `Skipping Google Indexing for ${indexing.url} (Service not initialized)`,
      );
      return;
    }

    try {
      const response = await this.indexingClient.urlNotifications.publish({
        requestBody: {
          url: indexing.url,
          type: indexing.type,
        },
      });
      this.logger.log(
        `Google Indexing API called for ${indexing.url} [${indexing.type}]`,
      );
      this.logger.debug(response.data);
    } catch (error: any) {
      this.logger.error(
        `Failed to call Google Indexing API for ${indexing.url}`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  private readonly batchUrl = 'https://indexing.googleapis.com/batch';

  async sendBatchIndexing(indexings: Indexing[]) {
    const client = await this.auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const accessToken = tokenResponse.token;

    // 2. Xây dựng Multipart/Mixed Body
    const boundary = `batch_${Date.now()}`;
    let body = '';

    indexings.forEach((indexing) => {
      body += `--${boundary}\n`;
      body += 'Content-Type: application/http\n';
      body += 'Content-Transfer-Encoding: binary\n\n';

      body += 'POST /v3/urlNotifications:publish\n';
      body += 'Content-Type: application/json\n\n';

      body +=
        JSON.stringify({
          url: indexing.url,
          type: indexing.type,
        }) + '\n';
    });
    body += `--${boundary}--`;

    // 3. Gửi Request
    try {
      const response = await axios.post(this.batchUrl, body, {
        headers: {
          'Content-Type': `multipart/mixed; boundary=${boundary}`,
          Authorization: `Bearer ${accessToken}`,
        },
      });
      console.log(response);
    } catch (error) {
      console.error(
        'Batch Indexing Error:',
        error instanceof Error ? error.message : error,
      );
      throw error;
    }
  }
}
