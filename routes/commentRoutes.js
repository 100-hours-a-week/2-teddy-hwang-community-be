const express = require('express');
const { createComment, updateComment, findByUserId, deleteComment,  } = require('../controllers/commentController')

const router = express.Router();

router.post('/', createComment);

router.patch('/:comment_id', updateComment);

router.get('/:comment_id', findByUserId);

router.delete('/:comment_id', deleteComment);

module.exports = router;