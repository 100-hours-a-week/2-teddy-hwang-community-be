const express = require('express');
const { createComment, updateComment } = require('../controllers/commentController')

const router = express.Router();

router.post('/', createComment);

router.patch('/:comment_id', updateComment);

module.exports = router;