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

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log('\n🚀 ========================================');
  console.log(`🔴 Franco Sport API is running!`);
  console.log(`⚡ "No es suerte, es esfuerzo"`);
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log('========================================\n');
});
