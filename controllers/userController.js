const { BadRequest, InternalServerError } = require('../middleware/customError');
const UserModel = require('../model/User');
const bcrypt = require('bcrypt');


//사용자 생성
const createUser = async (req, res, next) => {
    const { email, password, nickname, profile_image } = req.body;
    //사용자 정보가 입력되지 않았을 때
    if(!email || !password || !nickname) {
        return next(new BadRequest());
    }

    try {
        //이메일 중복검사
        const existingEmail = await UserModel.findByEmail(email);
        if(existingEmail) {
            return next(new BadRequest());
        }
        //닉네임 중복검사
        const existingNickname = await UserModel.findByNickname(nickname);
        if(existingNickname) {
            return next(new BadRequest());
        }
        const encryptPassword = await bcrypt.hash(password, 10);
        //회원가입
        const newUser = await UserModel.save({
            email,
            password: encryptPassword,
            nickname,
            profile_image: profile_image || ''
        });

        const { id } = newUser;

        res.status(201).json({
            message: '회원가입을 성공했습니다.',
            data: {
                user_id: { id }
            }
        });
    }catch(error) {
        return next(new InternalServerError());
    }
}
const login = async (req, res, next) => {
    const { email, password } = req.body;

    if(!email || !password) {
        return next(new BadRequest());
    }
    try {
        const user = await UserModel.findByEmail(email);

        if(!user){
            return next(new BadRequest());
        }
        //저장된 비밀번호와 입력된 비밀번호 비교
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if(!isPasswordValid){
            return next(new BadRequest());
        }
        
        const { id } = user;

        res.status(200).json({
            message: '로그인을 성공했습니다.',
            data: {
                user_id: { id }
            }
        });
    }catch(error) {
        return next(new InternalServerError());
    }
}

module.exports = { createUser, login };
