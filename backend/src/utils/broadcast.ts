import { WebSocketServer, WebSocket } from 'ws';
import { WsMessage } from '../types';

let wss: WebSocketServer | null = null;

export function registerWss(server: WebSocketServer): void {
  wss = server;
}

export function broadcast(message: WsMessage): void {
  if (!wss) return;
  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}