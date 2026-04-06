import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { testConnection } from './config/database';
import { initializeSchema } from './config/schema';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import userRoutes from './routes/user.routes';
import cartRoutes from './routes/cart.routes';
import { verifyAccessToken } from './utils/jwt';
import { JwtPayload, WsMessage } from './types';
import { registerWss, broadcast } from './utils/broadcast';



dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '4000');
const CLIENT_URL = (process.env.CLIENT_URL || 'http://localhost:3000').trim();

app.use(cors({ 
  origin: [CLIENT_URL],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'ProductHub API is running', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const server = http.createServer(app);

interface AuthenticatedWs extends WebSocket {
  isAlive: boolean;
  user?: JwtPayload;
}

const wss = new WebSocketServer({ server });

registerWss(wss);

wss.on('connection', (ws: AuthenticatedWs) => {
  ws.isAlive = true;
  console.log('🔌 WebSocket client connected');

  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString()) as WsMessage;

      if (message.type === 'AUTH' && message.payload) {
        const token = (message.payload as { token: string }).token;
        try {
          const payload = verifyAccessToken(token);
          ws.user = payload;
          ws.send(JSON.stringify({ type: 'AUTH_SUCCESS', payload: { userId: payload.userId, role: payload.role }, timestamp: new Date().toISOString() }));
        } catch {
          ws.send(JSON.stringify({ type: 'AUTH_ERROR', payload: { message: 'Invalid token' }, timestamp: new Date().toISOString() }));
        }
      }

      if (message.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
      }
    } catch {
      // Ignore malformed messages
    }
  });

  ws.on('close', () => { console.log('🔌 WebSocket client disconnected'); });
  ws.on('error', (error) => { console.error('WebSocket error:', error); });
});

const heartbeat = setInterval(() => {
  wss.clients.forEach((client) => {
    const ws = client as AuthenticatedWs;
    if (!ws.isAlive) { ws.terminate(); return; }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => { clearInterval(heartbeat); });

async function start(): Promise<void> {
  try {
    await testConnection();
    await initializeSchema();
    server.listen(PORT, () => {
      console.log(`🚀 ProductHub API running on http://localhost:${PORT}`);
      console.log(`🔌 WebSocket server running on ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();