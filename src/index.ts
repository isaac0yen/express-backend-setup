import express, { Request, Response, NextFunction } from 'express';
import routes from './routes/routes';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connect } from './modules/database';
import { logger } from './modules/logger';
import { AuthenticatedRequest } from './middlewares/auth';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger.json';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});

app.use(limiter);
app.use(express.json({ limit: '1mb' }));

// Swagger documentation route
app.use('very-secret-api/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/api', routes);

app.use((
  err: Error,
  req: Request<any, any, any> & AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  logger.error('An error occurred', { error: err.message }, { jwt: req.context || {} });
  res.status(500).json({ message: 'Internal Server Error' });
});

connect()
  .then(() => {
      app.listen(PORT, () => {
          console.log(`Server is running on http://localhost:${PORT}`);
          console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
      });
  })
  .catch((err) => {
      console.error('Failed to connect to the database:', err);
      process.exit(1);
  });