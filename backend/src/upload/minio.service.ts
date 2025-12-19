import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
  private minioClient: Minio.Client;
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.MINIO_BUCKET || 'ttn-bucket';
  }

  async onModuleInit() {
    this.minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
      region: process.env.MINIO_REGION, 
    });

    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName, process.env.MINIO_REGION || 'us-east-1');
        console.log(`Bucket ${this.bucketName} created successfully.`);
      } else {
          console.log(`Bucket ${this.bucketName} already exists.`);
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
      await this.minioClient.setBucketPolicy(this.bucketName, JSON.stringify(policy));
      console.log(`Bucket policy enforced to public.`);
    } catch (err) {
      console.error('Error initializing MinIO:', err);
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

    return {
      url: this.getFileUrl(filename),
      filename: filename
    };
  }

  async deleteFile(filename: string) {
    await this.minioClient.removeObject(this.bucketName, filename);
  }

  private getFileUrl(filename: string): string {
    const publicUrl = process.env.MINIO_PUBLIC_URL;

    // Priority 1: Use Custom Public URL (Production/CDN)
    // Example: https://cdn.mysite.com/ttn-bucket
    if (publicUrl) {
      // Remove trailing slash if exists
      const cleanUrl = publicUrl.replace(/\/$/, '');
      return `${cleanUrl}/${filename}`;
    }

    // Priority 2: Fallback to constructing URL manually (Localhost / Direct IP)
    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
    const host = process.env.MINIO_ENDPOINT || 'localhost';
    const port = process.env.MINIO_PORT || '9000';
    
    // Check if port is standard (80/443) to hide it in URL
    const isStandardPort = (protocol === 'http' && port == '80') || (protocol === 'https' && port == '443');
    const portString = isStandardPort ? '' : `:${port}`;

    return `${protocol}://${host}${portString}/${this.bucketName}/${filename}`;
  }
}
