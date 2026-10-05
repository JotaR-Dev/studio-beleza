import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { routes } from './routes';
import { NotificationSystem } from './services/whatsapp.worker';

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api', routes);

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`🚀 API rodando na porta ${PORT}`);
  NotificationSystem.start();
});
