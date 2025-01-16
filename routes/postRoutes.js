// routes/postRoutes.js
const express = require('express');
const { 
    createPost, 
    updatePost, 
    getAllPosts, 
    getOnePost, 
    deletePost, 
    getOnePostWithoutView 
} = require('../controllers/postController');
const { authMiddleware } = require('../middleware/auth');
const likeRoutes = require('./likeRoutes');

const router = express.Router();

router.post('/', authMiddleware, ...createPost);
router.patch('/:post_id', authMiddleware, ...updatePost);

router.get('/', authMiddleware, getAllPosts);
router.get('/:post_id', authMiddleware, getOnePost);
router.get('/:post_id/without-vie w', authMiddleware, getOnePostWithoutView);

router.delete('/:post_id', authMiddleware, deletePost);

router.use('/', likeRoutes);  // likeRoutes에서 개별적으로 authMiddleware 적용

module.exports = router;