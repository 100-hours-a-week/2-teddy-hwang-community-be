class CustomError extends Error{
    constructor(message, statusCode) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
    }
}

class BadRequest extends CustomError{
    constructor(message = '잘못된 요청입니다') {
        super(message, 400);
    }
}

class InternalServerError extends CustomError{
    constructor(message = '서버에 문제가 발생했습니다') {
        super(message, 500);
    }
}

module.exports = {CustomError, BadRequest, InternalServerError};