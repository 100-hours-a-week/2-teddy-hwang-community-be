const express = require('express');
const { addLike, removeLike } = require('../controllers/likeController');

const router = express.Router();

router.post('/:post_id/like', addLike);

router.delete('/:post_id/like', removeLike);

module.exports = router;