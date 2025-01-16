// routes/commentRoutes.js
const express = require('express');
const { 
    createComment, 
    updateComment, 
    findCommentUser, 
    deleteComment 
} = require('../controllers/commentController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, createComment);
router.patch('/:comment_id', authMiddleware, updateComment);
router.get('/:comment_id', authMiddleware, findCommentUser);
router.delete('/:comment_id', authMiddleware, deleteComment);

module.exports = router;