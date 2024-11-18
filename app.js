const express = require('express');
const cors = require('cors');
const app = express();

const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes');
const commentRoutes = require('./routes/commentRoutes');

app.use(express.json());
app.use(cors());

app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', commentRoutes);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`서버가 작동중입니다. http://localhost:${PORT}`);
});

