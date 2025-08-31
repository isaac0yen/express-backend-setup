export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
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

export interface NotificationResult {
  success: boolean;
  statusCode?: number;
  headers?: unknown;
  error?: string;
  shouldRemoveSubscription?: boolean;
}

export interface BulkNotificationResult {
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    subscription: PushSubscription;
    result: NotificationResult;
  }>;
}