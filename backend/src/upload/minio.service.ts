import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private minioClient: Minio.Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get<string>('MINIO_BUCKET')!;
  }

  async onModuleInit() {
    const useSSL = this.configService.get<string | boolean>('MINIO_USE_SSL');
    const isUseSSL = useSSL === true || useSSL === 'true';

    this.minioClient = new Minio.Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT')!,
      port: parseInt(
        this.configService.get<string>('MINIO_PORT') || '9000',
        10,
      ),
      useSSL: isUseSSL,
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY')!,
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY')!,
      region: this.configService.get<string>('MINIO_REGION')!,
    });

    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(
          this.bucketName,
          this.configService.get<string>('MINIO_REGION') || 'us-east-1',
        );
        this.logger.log(`Bucket ${this.bucketName} created successfully.`);
      } else {
        this.logger.log(`Bucket ${this.bucketName} already exists.`);
      }

      // Always ensure policy is public readonly on startup
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${this.bucketName}/*`],
          },
        ],
      };
      await this.minioClient.setBucketPolicy(
        this.bucketName,
        JSON.stringify(policy),
      );
      this.logger.log(`Bucket policy enforced to public.`);
    } catch (err) {
      this.logger.error('Error initializing MinIO:', err);
    }
  }

  async uploadFile(file: Express.Multer.File) {
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.originalname.replace(/\s+/g, '-')}`;

    await this.minioClient.putObject(
      this.bucketName,
      filename,
      file.buffer,
      file.size,
      {
        'Content-Type': file.mimetype,
      },
    );

    const fileUrl = this.getFileUrl(filename);
    this.logger.log(`File uploaded: ${filename}, URL: ${fileUrl}`);

    return {
      url: fileUrl,
      filename: filename,
    };
  }

  async deleteFile(filename: string) {
    await this.minioClient.removeObject(this.bucketName, filename);
  }

  private getFileUrl(filename: string): string {
    const publicUrl = this.configService.get<string>('MINIO_PUBLIC_URL');

    // Priority 1: Use Custom Public URL (Production/CDN)
    if (publicUrl) {
      const cleanUrl = publicUrl.replace(/\/$/, '');
      return `${cleanUrl}/${filename}`;
    }

    // Priority 2: Fallback to constructing URL manually
    const useSSL = this.configService.get<string | boolean>('MINIO_USE_SSL');
    const isUseSSL = useSSL === true || useSSL === 'true';
    const protocol = isUseSSL ? 'https' : 'http';

    const host = this.configService.get<string>('MINIO_ENDPOINT')!;
    const portValue = this.configService.get<string | number>('MINIO_PORT')!;
    const port =
      typeof portValue === 'number' ? portValue : parseInt(portValue, 10);

    const isStandardPort =
      (protocol === 'http' && port === 80) ||
      (protocol === 'https' && port === 443);
    const portString = isStandardPort ? '' : `:${port}`;

    return `${protocol}://${host}${portString}/${this.bucketName}/${filename}`;
  }
}
