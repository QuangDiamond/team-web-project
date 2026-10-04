import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/environment.js';
import healthRoutes from './routes/health.routes.js';
import { notFound, errorHandler } from './common/middlewares/error.middleware.js';
import { router } from './routes/index.routes.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Team Web Project API',
  });
});

app.use('/api/health', healthRoutes);
app.use('/api', router);
app.use(notFound);
app.use(errorHandler);

export default app;
