const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes');
const commentRoutes = require('./routes/commentRoutes');

const app = express();

app.disable('x-powered-by');

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
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// API 요청 제한
const limiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 15분
	limit: 10, // 최대 요청 100건
	standardHeaders: 'draft-8', 
    message: "너무 많은 요청이 들어왔습니다. 잠시 후 다시 시도해주세요.",
	legacyHeaders: false
	// store: ... , // Redis, Memcached, etc. See below.
});

app.use(limiter);

app.use(helmet());

// helmet 미들웨어 설정
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'cdnjs.cloudflare.com'],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', process.env.S3_BUCKET_URL],
        connectSrc: ["'self'", process.env.CORS_ORIGIN, process.env.CORS_EC2],
        objectSrc: ["'none'"],        // object 태그 사용 완전 차단
        baseUri: ["'self'"],          // base 태그 제한
        formAction: ["'self'"],       // form 제출 제한
        frameAncestors: ["'none'"],   // iframe embedding 방지
        manifestSrc: ["'self'"],      // 웹 매니페스트 파일 제한
    } 
}));

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
