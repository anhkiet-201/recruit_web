import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthClient, GoogleAuth } from 'google-auth-library';
import { google, indexing_v3 } from 'googleapis';

export type IndexingType = 'URL_UPDATED' | 'URL_DELETED';
export type Indexing = {
  url: string;
  type: IndexingType;
};

@Injectable()
export class GoogleIndexingService {
  private readonly logger = new Logger(GoogleIndexingService.name);
  private indexingClient: indexing_v3.Indexing | null = null;
  private auth: GoogleAuth<AuthClient> | null = null;

  constructor(private configService: ConfigService) {
    this.initGoogleClient();
  }

  private initGoogleClient() {
    const email = this.configService.get<string>(
      'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    );
    const privateKey = this.configService.get<string>('GOOGLE_PRIVATE_KEY');

    if (!email || !privateKey) {
      this.logger.warn(
        'Google Service Account credentials not found in environment variables. Indexing API disabled.',
      );
      return;
    }

    try {
      this.auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: email,
          private_key: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
        },
        scopes: ['https://www.googleapis.com/auth/indexing'], // ✅ CORRECT SCOPE
      });

      this.indexingClient = google.indexing({
        version: 'v3',
        auth: this.auth,
      });

      this.logger.log('Google Indexing API initialized successfully');
    } catch (error: unknown) {
      this.logger.error(
        'Failed to initialize Google Indexing API',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Validate that URL belongs to vieclamhr.com domain
   * Reject localhost, IP addresses, and local development URLs
   */
  private validateUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      // ❌ Block localhost and loopback addresses
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.16.') ||
        hostname.endsWith('.local')
      ) {
        return false;
      }

      // ❌ Block IP addresses (only allow domain names)
      if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
        return false;
      }

      // ✅ Only allow vieclamhr.com production domain
      return hostname === 'vieclamhr.com' || hostname === 'www.vieclamhr.com';
    } catch {
      return false;
    }
  }

  async publishUrl(indexing: Indexing): Promise<void> {
    if (!this.indexingClient) {
      this.logger.warn('Indexing API not initialized. Skipping.');
      return;
    }

    // ✅ URL Validation
    if (!this.validateUrl(indexing.url)) {
      this.logger.error(
        `Invalid URL domain: ${indexing.url}. Only vieclamhr.com allowed.`,
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
        `✅ Indexing API called: ${indexing.url} [${indexing.type}]`,
      );
      this.logger.debug(response.data);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `❌ Indexing API failed for ${indexing.url}: ${errorMessage}`,
      );
    }
  }

  /**
   * Batch indexing using official googleapis library with rate limiting
   */
  async sendBatchIndexing(indexings: Indexing[]) {
    if (!this.indexingClient || !this.auth) {
      this.logger.warn('Indexing API not initialized. Skipping batch.');
      return;
    }

    // ✅ Filter only valid URLs
    const validIndexings = indexings.filter((idx) => this.validateUrl(idx.url));

    if (validIndexings.length === 0) {
      this.logger.warn('No valid URLs to index');
      return;
    }

    // Send individually with delay to avoid rate limits
    for (const indexing of validIndexings) {
      await this.publishUrl(indexing);
      // Add delay between requests (200 requests/day limit)
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
    }

    this.logger.log(
      `Batch indexing completed: ${validIndexings.length} URLs processed`,
    );
  }
}
