const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const { sessionStore } = require('./config/dbConfig');
require('dotenv').config();

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

// 쿠키 및 세션 설정
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: process.env.SESSION_RESAVE === 'true',
    saveUninitialized: process.env.SESSION_SAVE_UNINITIALIZED === 'true',
    store: sessionStore,
    cookie: {
        httpOnly: process.env.SESSION_COOKIE_HTTP_ONLY === 'true',
        secure: process.env.SESSION_COOKIE_SECURE === 'true',
        maxAge: parseInt(process.env.SESSION_COOKIE_MAX_AGE)
    }
}));

// json 설정
app.use(express.json());

// 경로 설정
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


