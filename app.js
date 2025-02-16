const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes');
const commentRoutes = require('./routes/commentRoutes');
const { deleteExpiredTokens } = require('./model/RefreshToken');
const { executeTransaction } = require('./config/dbConfig');

const app = express();

app.disable('x-powered-by');

// DB 연결
const startServer = async () => {
  try {
    console.log('데이터베이스 연결 성공');

    // 일주일 마다 실행 (매주 일요일 자정)
    cron.schedule('0 0 * * 0', async () => {
      try {
        await deleteExpiredTokens();
        console.log('만료된 refresh tokens 삭제 완료');
      } catch (error) {
        console.error('만료된 토큰 삭제 중 에러:', error);
      }
    });

    app.listen(process.env.PORT, () => {
      console.log(`서버가 작동중입니다. http://localhost:${process.env.PORT}`);
    });
  } catch (err) {
    console.error('데이터베이스 연결 실패:', err);
    process.exit(1);
  }
};

// cors 설정
app.use(
  cors({
    origin: [process.env.CORS_ORIGIN, process.env.CORS_EC2],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Retry-After'],
    credentials: true,
  }),
);

// API 요청 제한
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1분
  limit: 60, // 최대 요청 60건
  standardHeaders: 'draft-8',
  message: (req, res) => {
    const retryAfter = res.getHeader('Retry-After');
    const resetTime = parseInt(retryAfter);
    return `너무 많은 요청이 들어왔습니다. ${resetTime}초 후에 다시 시도해주세요.`;
  },
  legacyHeaders: false,
});

app.use(limiter);

app.use(helmet());

// helmet 미들웨어 설정
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'cdnjs.cloudflare.com'],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', process.env.S3_BUCKET_URL],
      connectSrc: ["'self'", process.env.CORS_ORIGIN, process.env.CORS_EC2],
      objectSrc: ["'none'"], // object 태그 사용 완전 차단
      baseUri: ["'self'"], // base 태그 제한
      formAction: ["'self'"], // form 제출 제한
      frameAncestors: ["'none'"], // iframe embedding 방지
      manifestSrc: ["'self'"], // 웹 매니페스트 파일 제한
    },
  }),
);

// 쿠키 파서 설정
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 헬스 체크 엔드포인트
app.get('/health-check', async (req, res) => {
  const health = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date(),
    service: 'backend',
    database: 'connected'
  };

  try {
    // 데이터베이스 연결 상태 확인
    await executeTransaction(async (conn) => {
      await conn.query('SELECT 1');
    });
    
    res.status(200).json(health);
  } catch (error) {
    health.status = 'error';
    health.database = 'disconnected';
    health.message = error.message;
    res.status(503).json(health);
  }
});

// 경로 설정
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', commentRoutes);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    data: null,
  });
});

startServer();
