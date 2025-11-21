/**
 * Configuration file cho API và Socket.IO URLs
 * 
 * Để chuyển đổi giữa development và production:
 * - Development: Dùng localhost
 * - Production: Dùng Vercel URL
 */

// Tự động detect môi trường
const isDevelopment = import.meta.env.DEV;

// Config URLs
export const config = {
  // API Base URL
  API_BASE_URL: isDevelopment 
    ? "http://localhost:5002" // Backend local của bạn
    : "http://localhost:5002",
  
  // Socket.IO URL
  SOCKET_URL: isDevelopment
    ? "http://localhost:5002" // Backend local của bạn  
    : "http://localhost:5002",
  
  // Socket.IO config
  SOCKET_CONFIG: {
    transports: ["polling"], // Vercel không hỗ trợ WebSocket tốt
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    timeout: 20000,
    path: "/socket.io",
  }
};

// Log để biết đang dùng môi trường nào
console.log(`🌍 Environment: ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'}`);
console.log(`📡 API URL: ${config.API_BASE_URL}`);
console.log(`🔌 Socket URL: ${config.SOCKET_URL}`);

export default config;
