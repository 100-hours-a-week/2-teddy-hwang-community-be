const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes');
const commentRoutes = require('./routes/commentRoutes');

const app = express();

// DB 연결
const startServer = async () => {
    try {
        console.log('데이터베이스 연결 성공');

        app.listen(process.env.PORT, () => {
            console.log(`서버가 작동중입니다. http://localhost:${process.env.PORT}`);
        });
    } catch (err) {
        console.error('데이터베이스 연결 실패:', err);
        process.exit(1);
    }
};

// cors 설정
app.use(cors({
    origin: [
        process.env.CORS_ORIGIN,
        process.env.CORS_EC2
    ],
    credentials: true
}));

app.use(helmet());

// Content Security Policy 설정
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'cdnjs.cloudflare.com'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:', process.env.S3_BUCKET_URL],
        connectSrc: ["'self'", process.env.CORS_ORIGIN, process.env.CORS_EC2],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"]
    }
}));
// XSS 방지 설정 강화
app.use(helmet.xssFilter());
// DNS Prefetch Control 설정
app.use(helmet.dnsPrefetchControl({ allow: false }));
// Frame 옵션 설정 (클릭재킹 방지)
app.use(helmet.frameguard({ action: 'deny' }));
// IE에서 콘텐츠 타입 추측 방지
app.use(helmet.ieNoOpen());
// X-Powered-By 헤더 제거
app.use(helmet.hidePoweredBy());

// 쿠키 파서 설정
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 경로 설정
app.use('/api/auth', authRoutes); 
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', commentRoutes);  

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        message: err.message || 'Internal Server Error',
        data: null
    });
});

startServer();
