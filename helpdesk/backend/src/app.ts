import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health';
import { errorHandler } from './middleware/errorHandler';

export const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRouter);

// Global error handler must be registered last
app.use(errorHandler);
