const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const fileStore = require('session-file-store')(session);
require('dotenv').config();
const app = express();

const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes');
const commentRoutes = require('./routes/commentRoutes');


app.use(cors({
    origin: [
        process.env.CORS_ORIGIN,
        process.env.CORS_EC2
    ],
    credentials: true
}));

app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: process.env.SESSION_RESAVE === 'true',
    saveUninitialized: process.env.SESSION_SAVE_UNINITIALIZED === 'true',
    store: new fileStore(),
    cookie: {
        httpOnly: process.env.SESSION_COOKIE_HTTP_ONLY === 'true',
        secure: process.env.SESSION_COOKIE_SECURE === 'true',
        maxAge: parseInt(process.env.SESSION_COOKIE_MAX_AGE)
    }
}));

app.use(express.json());

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

app.listen(process.env.PORT, () => {
    console.log(`서버가 작동중입니다. http://localhost:${process.env.PORT}`);
});

