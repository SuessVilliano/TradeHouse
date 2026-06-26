import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import livekitRoutes from './routes/livekit.js';
import channelRoutes from './routes/channels.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(morgan('dev'));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? true : ['http://localhost:5173', 'http://localhost:3001'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/livekit', livekitRoutes);
app.use('/api/channels', channelRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'TradeHouse API' });
});

if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, 'public');
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => { res.sendFile(path.join(clientBuildPath, 'index.html')); });
}

app.listen(PORT, () => {
  console.log(`🚀 TradeHouse server running on port ${PORT}`);
  console.log(`   ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   LiveKit: ${process.env.LIVEKIT_URL || '(not configured)'}`);
  console.log(`   Supabase: ${process.env.SUPABASE_URL || '(not configured)'}`);
});

export default app;
