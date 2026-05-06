import { Injectable, Logger } from '@nestjs/common';
import * as AWS from 'aws-sdk';

@Injectable()
export class StorageService {
  private readonly s3: AWS.S3;
  private readonly bucket: string;
  private readonly logger = new Logger(StorageService.name);

  constructor() {
    this.bucket = process.env.S3_BUCKET ?? 'taxivanille';
    this.s3 = new AWS.S3({
      endpoint: process.env.S3_ENDPOINT,
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY,
      region: process.env.S3_REGION ?? 'gra',
      s3ForcePathStyle: true,
    });
  }

  async upload(key: string, buffer: Buffer, contentType: string) {
    await this.s3.putObject({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }).promise();
    return key;
  }

  async getSignedUrl(key: string, expiresInSeconds: number): Promise<string> {
    return this.s3.getSignedUrlPromise('getObject', {
      Bucket: this.bucket,
      Key: key,
      Expires: expiresInSeconds,
    });
  }

  async delete(key: string) {
    await this.s3.deleteObject({ Bucket: this.bucket, Key: key }).promise();
  }
}
