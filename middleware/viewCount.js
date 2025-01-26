const checkViewCount = (req, res, next) => {
    const postId = Number(req.params.post_id);
    const viewedPosts = req.cookies.viewedPosts ? JSON.parse(req.cookies.viewedPosts).map(Number) : [];

    req.shouldIncreaseViewCount = !viewedPosts.includes(postId);
    
    if(req.shouldIncreaseViewCount) {
        viewedPosts.push(postId);
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        const timeUntilMidnight = midnight - now;

        res.cookie('viewedPosts', JSON.stringify(viewedPosts), { 
            expires: new Date(Date.now() + timeUntilMidnight),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
    }
    next();
}   

module.exports = {
    checkViewCount
};