const express = require('express');
const { addLike } = require('../controllers/likeController');

const router = express.Router();

router.post('/:post_id/like', addLike);

module.exports = router;