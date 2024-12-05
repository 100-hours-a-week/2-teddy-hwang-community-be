const { UnauthorizedError, ForbiddenError } = require('./customError');

const isAuthenticated = (req, res, next) => {
    if (!req.session.user) {
        return next(new UnauthorizedError());
    }
    next();
};

const isResourceOwner = (req, res, next) => {
    const requestedUserId = Number(req.params.user_id);
    if (req.session.user.id !== requestedUserId) {
        return next(new ForbiddenError());
    }
    next();
};

module.exports = {
    isAuthenticated,
    isResourceOwner
};