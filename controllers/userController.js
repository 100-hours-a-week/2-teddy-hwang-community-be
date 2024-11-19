const { BadRequest, InternalServerError } = require('../middleware/customError');
const UserModel = require('../model/User');
const bcrypt = require('bcrypt');


//사용자 생성
const createUser = async (req, res, next) => {
    const { email, password, nickname, profile_image } = req.body;
    //사용자 정보가 입력되지 않았을 때
    if(!email || !password || !nickname || !profile_image) {
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
//로그인
const login = async (req, res, next) => {
    const { email, password } = req.body;

    //사용자 정보가 입력되지 않았을 때
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
//회원 정보 조회
const getUserDetails = async (req, res, next) => {
    //경로 파라미터 추출
    const id = req.params.user_id;
    
    try {
        const user = await UserModel.findById(id);

        res.status(200).json({
            message: '회원 정보 조회를 성공했습니다.',
            data: {
                user_id: user.id,
                email : user.email,
                nickname : user.nickname,
                profile_image : user.profile_image
            }
        });
    }catch(error) {
        return next(new InternalServerError());
    }
}
//회원 정보 수정
const updateUserInfo = async (req, res, next) => {
    //경로 파라미터 추출
    const id = req.params.user_id;
    const { nickname, profile_image } = req.body;

    if(!nickname) {
        return next(new BadRequest());
    }
    
    try {
        const user = await UserModel.update(id, nickname, profile_image);
    
        res.status(200).json({
            message: '회원 정보 수정을 성공했습니다.',
            data: {
                user_id: user.id
            }
        });
    }catch(error) {
        return next(new InternalServerError());
    }
}

module.exports = { createUser, login, getUserDetails, updateUserInfo };
