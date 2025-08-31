import express, { Request, Response } from 'express';
import routes from './routes/routes';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connect } from './modules/database';
import { logger } from './modules/logger';
import { AuthenticatedRequest } from './middlewares/auth';
import { corsOriginHandler, corsConfig } from './config/cors.config';
import { logCorsConfig } from './utils/cors.utils';
import { DateTime } from 'luxon';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
}));

const corsOptions = {
  origin: corsOriginHandler,
  ...corsConfig.options
};

app.use(cors(corsOptions));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests from this IP, please try again later.',
});

app.use(limiter);

app.use('/api', routes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: DateTime.now().toString(),
    version: '2.0.0'
  });
});

// Serve the main app for unknown non-API routes (SPA support)
app.get('*', (req: Request, res: Response) => {
  // Don't serve index.html for API routes or static assets
  if (req.path.startsWith('/api') || req.path.includes('.')) {
    return res.status(404).json({ message: 'Not Found' });
  }
});

app.use((
  err: Error,
  req: Request<unknown, unknown, unknown> & AuthenticatedRequest,
  res: Response,
) => {
  logger.error('An error occurred', { error: err }, { jwt: req.context || {} });
  res.status(500).json({ message: 'Internal Server Error' });
});

connect()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`Server is running on http://localhost:${PORT}`);

      // Log CORS configuration
      logCorsConfig();
    });
  })
  .catch((err) => {
    logger.error('Failed to connect to the database:', err);
    process.exit(1);
  });