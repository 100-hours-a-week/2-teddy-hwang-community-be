const { BadRequest, InternalServerError } = require('../middleware/customError');
const { save, findByEmail, existsByNicknameSignup, findById, updateUser, updatePassword, existsByNicknameUpdate, deleteUser } = require('../model/User');
const bcrypt = require('bcrypt');
const { userUpload } = require('../config/s3Config');

//사용자 생성
const createUser = async (req, res, next) => {
    try {
        const { email, password, nickname } = req.body;
        const imageUrl = req.file ? req.file.location : "";
        
        //사용자 정보가 입력되지 않았을 때
        if(!email || !password || !nickname || !imageUrl) {
            return next(new BadRequest());
        }

        //이메일 중복검사
        const existingEmail = await findByEmail(email);
        if(existingEmail) {
            return next(new BadRequest());
        }
        //닉네임 중복검사
        const existingNickname = await existsByNicknameSignup(nickname);
        if(existingNickname) {
            return next(new BadRequest());
        }
        const encryptPassword = await bcrypt.hash(password, 10);
        //회원가입
        const newUser = await save({
            email,
            password: encryptPassword,
            nickname,
            profile_image: imageUrl
        });

        res.status(201).json({
            message: '회원가입을 성공했습니다.',
            data: {
                user_id: newUser.id
            }
        });
    }catch(error) {
        return next(new InternalServerError());
    }
}
//회원 정보 조회
const getUserDetails = async (req, res, next) => {
    try {
        const id = Number(req.user.id);
        
        const user = await findById(id);

        res.status(200).json({
            message: '회원 정보 조회를 성공했습니다.',
            data: {
                user_id: user.user_id,
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
        const id = Number(req.user.id);
        const { nickname } = req.body;
        const imageUrl = req.file ? req.file.location : req.body.image;

        if(!nickname) {
            return next(new BadRequest());
        }
        
        const user = await updateUser(id, nickname, imageUrl);
    
        res.status(200).json({
            message: '회원 정보 수정을 성공했습니다.',
            data: {
                user_id: user.id,
                profile_image: user.profile_image,
                nickname: user.nickname
            }
        });
    }catch(error) {
        return next(new InternalServerError());
    }
}
//비밀번호 수정
const updateUserPassword = async (req, res, next) => {
    try {
        //경로 파라미터 추출
        const id = Number(req.user.id);
        const password = req.body.password;

        if(!password) {
            return next(new BadRequest());
        }

        const user = await updatePassword(id, password);
    
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

        const user = await findByEmail(email);

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
//닉네임 중복 확인(유저 수정)
const checkNicknameUpdate = async (req, res, next) => {  
    try {
        const id = Number(req.user.id);
        const nickname = req.params.nickname;

        const user = await existsByNicknameUpdate(nickname, id);

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
//닉네임 중복 확인(회원가입)
const checkNicknameSignup = async (req, res, next) => {  
    try {
        const nickname = req.params.nickname;

        const user = await existsByNicknameSignup(nickname);

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
//회원 탈퇴
const removeUser = async (req, res, next) => {
    try {
        const id = Number(req.user_id);
    
        const user = await deleteUser(id);

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
     createUser: [userUpload.single('image'), createUser], 
     getUserDetails, 
     updateUserInfo: [userUpload.single('image'), updateUserInfo], 
     updateUserPassword,
     existsByEmail,
     checkNicknameSignup,
     checkNicknameUpdate,
     removeUser,
};
