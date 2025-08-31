/**
 * CORS Configuration
 * Manages allowed origins based on environment
 */

export const corsConfig = {
  // Approved URLs for production environment
  approvedUrls: [
    '',
  ],

  // CORS options
  options: {
    credentials: true, // Allow credentials (cookies, authorization headers)
    optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
      'Pragma',
      'X-Paystack-Signature'
    ]
  }
};

/**
 * CORS origin function that checks allowed origins based on environment
 */
export const corsOriginHandler = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  // Allow requests with no origin (like mobile apps, curl requests, Paystack webhooks, or same-origin requests)
  if (!origin) return callback(null, true);

  // Allow Paystack webhook requests (they come from paystack.com domains)
  if (origin.includes('paystack.com') || origin.includes('paystack.co')) {
    return callback(null, true);
  }

  if (process.env.NODE_ENV === 'production') {
    // In production, only allow approved URLs
    if (corsConfig.approvedUrls.includes(origin)) {
      callback(null, true);
    } else {
      const error = new Error(`CORS: Origin '${origin}' not allowed in production mode`);
      callback(error, false);
    }
  } else {
    // In development, allow all origins
    callback(null, true);
  }
};
