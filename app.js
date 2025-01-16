const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
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
