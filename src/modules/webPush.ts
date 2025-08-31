import webpush from 'web-push';
import dotenv from 'dotenv';
import { APP_EMAIL } from '../config/config';

dotenv.config();

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  `mailto:${APP_EMAIL}`,
  process.env.PUBLIC_VAPID_KEY!,
  process.env.PRIVATE_VAPID_KEY!
);

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: unknown;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  tag?: string;
  requireInteraction?: boolean;
}

const webPushNotification = {
  /**
   * Get the public VAPID key for frontend subscription
   */
  getPublicVapidKey: () => {
    return process.env.PUBLIC_VAPID_KEY;
  },

  /**
   * Send a push notification to a single subscription
   */
  sendNotification: async (subscription: PushSubscription, payload: NotificationPayload) => {
    try {
      // Validate subscription before sending
      if (!webPushNotification.validateSubscription(subscription)) {
        return {
          success: false,
          error: 'Invalid subscription format',
          statusCode: 400,
          shouldRemoveSubscription: false
        };
      }

      const payloadString = JSON.stringify(payload);

      const result = await webpush.sendNotification(subscription, payloadString);

      return {
        success: true,
        statusCode: result.statusCode,
        headers: result.headers,
        shouldRemoveSubscription: false
      };
    } catch (error: unknown) {
      // Handle specific web-push errors
      const webPushError = error as { statusCode?: number; message?: string };
      if (webPushError.statusCode === 410 || webPushError.statusCode === 404) {
        return {
          success: false,
          error: 'Subscription expired or invalid',
          statusCode: webPushError.statusCode,
          shouldRemoveSubscription: true
        };
      }

      return {
        success: false,
        error: webPushError.message || 'Failed to send notification',
        statusCode: webPushError.statusCode || 500,
        shouldRemoveSubscription: false
      };
    }
  },

  /**
   * Send push notifications to multiple subscriptions
   */
  sendBulkNotifications: async (subscriptions: PushSubscription[], payload: NotificationPayload) => {
    const results = await Promise.allSettled(
      subscriptions.map(subscription =>
        webPushNotification.sendNotification(subscription, payload)
      )
    );

    const successful = results.filter(result =>
      result.status === 'fulfilled' && result.value.success
    ).length;

    const failed = results.length - successful;

    return {
      total: results.length,
      successful,
      failed,
      results: results.map((result, index) => ({
        subscription: subscriptions[index],
        result: result.status === 'fulfilled' ? result.value : { success: false, error: result.reason }
      }))
    };
  },

  /**
   * Validate a push subscription
   */
  validateSubscription: (subscription: unknown): subscription is PushSubscription => {
    if (!subscription || typeof subscription !== 'object') return false;

    const sub = subscription as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
    return (
      typeof sub.endpoint === 'string' &&
      sub.keys !== undefined &&
      typeof sub.keys === 'object' &&
      typeof sub.keys.p256dh === 'string' &&
      typeof sub.keys.auth === 'string'
    );
  },

  /**
   * Create a simple notification payload
   */
  createNotification: (title: string, body: string, options?: Partial<NotificationPayload>): NotificationPayload => {
    return {
      title,
      body,
      icon: options?.icon || '/favicon.ico',
      badge: options?.badge || '/favicon.ico',
      ...options
    };
  }
};

export default webPushNotification;