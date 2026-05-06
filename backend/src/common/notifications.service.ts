import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private initialized = false;

  constructor() {
    if (process.env.FCM_SERVER_KEY && !admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FCM_SERVER_KEY)),
      });
      this.initialized = true;
    }
  }

  async sendToDevice(fcmToken: string, title: string, body: string, data?: Record<string, string>) {
    if (!this.initialized || !fcmToken) return;
    try {
      await admin.messaging().send({ token: fcmToken, notification: { title, body }, data });
    } catch (err) {
      this.logger.warn(`FCM error: ${err.message}`);
    }
  }
}
