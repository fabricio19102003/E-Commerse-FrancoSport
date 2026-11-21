/**
 * Franco Sport API Server
 * "No es suerte, es esfuerzo"
 */

// Load environment variables before any other module reads them
import 'dotenv/config';
import { createServer } from 'http';
import app from './app.js';
import { initSocket } from './socket.js';

// ===== START SERVER =====

const PORT = process.env.PORT || 3001;
// Optional: the address to listen on (e.g. 127.0.0.1 to keep the API off the local network). Unset = all interfaces.
const HOST = process.env.HOST;

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

const onListening = () => {
  console.log('\n🚀 ========================================');
  console.log(`🔴 Franco Sport API is running!`);
  console.log(`⚡ "No es suerte, es esfuerzo"`);
  console.log(`📡 Server: http://${HOST || 'localhost'}:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log('========================================\n');
};

if (HOST) {
  httpServer.listen(PORT, HOST, onListening);
} else {
  httpServer.listen(PORT, onListening);
}
