// routes/likeRoutes.js
const express = require('express');
const { 
    addLike, 
    removeLike, 
    isLikedByUser 
} = require('../controllers/likeController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/:post_id/like', authMiddleware, addLike);
router.delete('/:post_id/like', authMiddleware, removeLike);
router.get('/:post_id/like', authMiddleware, isLikedByUser);

module.exports = router;