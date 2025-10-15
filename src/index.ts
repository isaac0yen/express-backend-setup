import express, { Request, Response, NextFunction } from 'express';
import routes from './routes/routes';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connect } from './modules/database';
import { logger } from './modules/logger';
import { AuthenticatedRequest } from './middlewares/auth';

import { corsOriginHandler, corsConfig } from './config/cors.config';
import { logCorsConfig } from './utils/cors.utils';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;


logger.init();


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
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});


app.use((
  err: Error,
  req: Request<any, any, any> & AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  logger.error('An error occurred', { error: err, jwt: req.context },);
  res.status(500).json({ message: 'Internal Server Error' });
});

connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);

      // Log CORS configuration
      logCorsConfig();

      // Start cron jobs
      try {
        logger.info('Cron jobs initialized successfully');
      } catch (cronError) {
        logger.error('Failed to initialize cron jobs:', cronError);
      }
    });
  })
  .catch((err) => {
    console.error('Failed to connect to the database:', err);
    process.exit(1);
  });