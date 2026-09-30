import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import livekitRoutes from './routes/livekit.js';
import arenaRoutes from './routes/arena.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(morgan('dev'));
app.disable('x-powered-by');

const productionOrigins = new Set([
  'https://battles.tradehybrid.co',
  'https://tradehouse-91io.onrender.com',
  'https://pro.tradehybrid.co',
  'https://tradehybrid.co',
  'https://www.tradehybrid.co',
  'https://hybridfunding.co',
  'https://www.hybridfunding.co',
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    if (productionOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origin is not allowed by Trade House CORS.'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/livekit', livekitRoutes);
app.use('/api/arena', arenaRoutes);

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
});

export default app;
