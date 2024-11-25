const express = require('express');
const cors = require('cors');
// const {CustomError, BadRequest, InternalServerError} = require('./middleware/customError');
const app = express();

const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes');
const commentRoutes = require('./routes/commentRoutes');
const likeRoutes = require('./routes/likeRoutes');

app.use(cors());
app.use(express.json());

app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/posts', likeRoutes);

app.use((err, req, res, next) => {
    const statusCode = err.statusCode;
    res.status(statusCode).json({
        message: err.message,
        data: null
    });
});

const PORT = 8080;
app.listen(PORT, () => {
    console.log(`서버가 작동중입니다. http://localhost:${PORT}`);
});

