const { BadRequest, InternalServerError } = require('../middleware/customError');
const UserModel = require('../model/User');
const bcrypt = require('bcrypt');


//사용자 생성
const createUser = async (req, res, next) => {
    try {
        const { email, password, nickname, profile_image } = req.body;
        //사용자 정보가 입력되지 않았을 때
        if(!email || !password || !nickname || !profile_image) {
            return next(new BadRequest());
        }

        //이메일 중복검사
        const existingEmail = await UserModel.existsByEmail(email);
        if(existingEmail) {
            return next(new BadRequest());
        }
        //닉네임 중복검사
        const existingNickname = await UserModel.existsByNickname(nickname);
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
    try {
        const { email, password } = req.body;

        //사용자 정보가 입력되지 않았을 때
        if(!email || !password) {
            return next(new BadRequest());
        }

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
    try {
        //경로 파라미터 추출
        const id = req.params.user_id;

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
    try {
        //경로 파라미터 추출
        const id = req.params.user_id;
        const { nickname, profile_image } = req.body;

        if(!nickname) {
            return next(new BadRequest());
        }
        
        const user = await UserModel.updateUser(id, nickname, profile_image);
    
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
//비밀번호 수정
const updatePassword = async (req, res, next) => {
    try {
        //경로 파라미터 추출
        const id = req.params.user_id;
        const password = req.body.password;

        if(!password) {
            return next(new BadRequest());
        }

        const user = await UserModel.updatePassword(id, password);
    
        res.status(200).json({
            message: '비밀번호 수정을 성공했습니다.',
            data: {
                user_id: user.id
            }
        });
    }catch(error) {
        return next(new InternalServerError());
    }
}
//이메일 중복 확인
const existsByEmail = async (req, res, next) => {  
    try {
        const email = req.params.email;

        const user = await UserModel.existsByEmail(email);

        if(!user) {
            res.status(200).json({
                message: '중복된 이메일이 없습니다.',
                data: true
            });
        }else {
            res.status(200).json({
                message: '중복된 이메일이 있습니다.',
                data: false
            });
        }
    }catch(error) {
        return next(new InternalServerError());
    }   
}
//닉네임 중복 확인
const existsByNickname = async (req, res, next) => {  
    try {
        const nickname = req.params.nickname;

        const user = await UserModel.existsByNickname(nickname);

        if(!user) {
            res.status(200).json({
                message: '중복된 닉네임이 없습니다.',
                data: true
            });
        }else {
            res.status(200).json({
                message: '중복된 닉네임이 있습니다.',
                data: false
            });
        }
    }catch(error) {
        return next(new InternalServerError());
    }   
}
//비밀번호 변경시 기존 암호가 맞는지 확인
const checkPasswordMatch = async (req, res, next) => {
    try {
        const id = req.params.user_id;
        const password = req.params.password;

        const user = await UserModel.checkPasswordMatch(id, password);

        if(user) {
            res.status(200).json({
                message: '기존 비밀번호와 일치합니다.',
                data: true
            });
        }else {
            res.status(200).json({
                message: '기존 비밀번호와 일치하지 않습니다.',
                data: false
            });
        }

    }catch(error) {
        return next(new InternalServerError());
    }
}
//회원 탈퇴
const deleteUser = async (req, res, next) => {
    try {
        const id = req.params.user_id;
    
        const user = await UserModel.deleteUser(id);

        if(user) {
            res.status(200).json({
                message: '회원 탈퇴를 성공했습니다.',
                data: {
                    user_id: id
                }
            });
        }else {
            next(new BadRequest());
        }
    }catch(error) {
        return next(new InternalServerError());
    }
}


module.exports = {
     createUser, 
     login, 
     getUserDetails, 
     updateUserInfo, 
     updatePassword,
     existsByEmail,
     existsByNickname,
     checkPasswordMatch,
     deleteUser
};
