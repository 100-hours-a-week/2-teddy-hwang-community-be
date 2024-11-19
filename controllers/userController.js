const { BadRequest, InternalServerError } = require('../middleware/customError');
const UserModel = require('../model/User');
const bcrypt = require('bcrypt');


//사용자 생성
const createUser = async (req, res, next) => {
    const {email, password, nickname, profile_image} = req.body;
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
        console.error(error);
        return next(new InternalServerError());
    }

    //기존 사용자 데이터 읽어오기

    //새로운 사용자 저장
}

module.exports = { createUser };
