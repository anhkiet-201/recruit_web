import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

/**
 * CORS Configuration
 * Hỗ trợ:
 * - Web App: https://timviec.vieclamhr.com, https://vieclamhr.com
 * - Mobile App: iOS/Android (origin: null hoặc không có origin header)
 * - Desktop App: Electron/Native (origin: file:// hoặc localhost)
 */

// Danh sách origins được phép cho Web Apps (đọc từ .env)
const ALLOWED_WEB_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
  : [
      // Fallback mặc định nếu không có ALLOWED_ORIGINS trong .env
      'https://timviec.vieclamhr.com',
    ];

// Kiểm tra origin có hợp lệ không
const isOriginAllowed = (origin: string | undefined): boolean => {
  // Không có origin header → Mobile/Desktop native app
  if (!origin) {
    return true;
  }

  // Origin là 'null' → Mobile app hoặc file:// protocol
  if (origin === 'null') {
    return true;
  }

  // Kiểm tra trong danh sách web origins cho phép
  if (ALLOWED_WEB_ORIGINS.includes(origin)) {
    return true;
  }

  // Cho phép localhost với bất kỳ port nào (Development)
  if (
    origin.startsWith('http://localhost') ||
    origin.startsWith('http://127.0.0.1')
  ) {
    return true;
  }

  // Cho phép file:// protocol cho Desktop app
  if (origin.startsWith('file://')) {
    return true;
  }

  return false;
};

/**
 * CORS Options cho NestJS
 */
export const corsOptions: CorsOptions = {
  // Dynamic origin validation
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },

  // Cho phép gửi credentials (cookies, authorization headers)
  credentials: true,

  // Các HTTP methods được phép
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  // Các headers frontend được phép gửi
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'Origin',
    'X-Requested-With',
    'X-Device-Id', // Custom header cho mobile/desktop tracking
    'X-App-Version', // Custom header cho app version
    'x-guest-id',
  ],

  // Các headers backend có thể expose cho frontend
  exposedHeaders: ['Content-Range', 'X-Content-Range', 'X-Total-Count'],

  // Cache preflight request 1 giờ để giảm số OPTIONS requests
  maxAge: 3600,

  // Trả về status 204 No Content cho OPTIONS requests
  optionsSuccessStatus: 204,
};
