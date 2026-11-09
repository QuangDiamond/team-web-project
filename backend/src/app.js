import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/environment.js';
import { notFound, errorHandler } from './common/middlewares/error.middleware.js';
import { router } from './routes/index.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../uploads');

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '25mb', verify: (req, _res, buffer) => { req.rawBody = buffer; } }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.use('/uploads', express.static(uploadsDir));

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Team Web Project API',
  });
});

app.use('/api', router);
app.use(notFound);
app.use(errorHandler);

export default app;
