const express = require('express');
const { addLike, removeLike, isLikedByUser } = require('../controllers/likeController');

const router = express.Router();

router.post('/:post_id/like', addLike);

router.delete('/:post_id/like', removeLike);

router.get('/:post_id/like', isLikedByUser);

module.exports = router;