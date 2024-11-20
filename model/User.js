const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { InternalServerError, BadRequest } = require('../middleware/customError');

class User {
    constructor() {
        this.filePath = path.join(__dirname, '../data/users.json');
    }
    //모든 유저 조회
    findAll() {
        try {
            const data = fs.readFileSync(this.filePath, 'utf8');
            return data ? JSON.parse(data) : [];
        }catch(error) {
            console.log(error);
            if(error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }
    //ID로 유저 조회
    findById(id) {
        try {
            const users = this.findAll();
            return users.find(user => Number(user.id) === Number(id));
        }catch(error) {
            throw new InternalServerError();
        }
    }
    //이메일로 유저 조회
    findByEmail(email) {
        try {
            const users = this.findAll();
            return users.find(user => user.email === email);
        }catch(error) {
            throw new InternalServerError();
        }
    }
    //닉네임으로 유저 조회
    findByNickname(nickname) {
        try {
            const users = this.findAll();
            return users.find(user => user.nickname === nickname);
        }catch(error) {
            throw new InternalServerError();
        }
    }
    //비밀번호 확인
    findByPassword(id, password) {
        try {
            const users = this.findAll();
            const user = users.find(user => user.id === id);
            
            if(!user) {
                throw new BadRequest();
            }

            const isPasswordValid = bcrypt.compareSync(user.password, password);

            if(!isPasswordValid) {
                throw new BadRequest();
            }

            return true;

        }catch(error) {
            throw new InternalServerError();
        }
    }
    //회원가입
    save(userData) {
        try {
            const users = this.findAll();
            const newUser = {
                id: users.length + 1,
                ...userData
            };
            users.push(newUser);
            fs.writeFileSync(this.filePath, JSON.stringify(users, null, 2), 'utf8');
            
            return newUser;
        }catch(error) {
            throw new InternalServerError();
        }
    }
    //회원 정보 수정
    updateUser(id, nickname, profile_image) {
        try {
            const users = this.findAll();
            const userIndex = users.findIndex(user => user.id === Number(id));

            if(userIndex === -1) {
                throw new Error('유저를 찾을 수 없습니다.');
            }
            //유저 정보 수정
            const updatedUser = {
                ...users[userIndex],
                nickname,
                profile_image
            };
            //배열에 반영
            users[userIndex] = updatedUser;

            fs.writeFileSync(this.filePath, JSON.stringify(users, null, 2), 'utf8');

            return updatedUser;
        }catch(error) {
            throw new InternalServerError();
        }
    }
     //비밀번호 수정
     updatePassword(id, password) {
        try {
            const users = this.findAll();
            const userIndex = users.findIndex(user => user.id === Number(id));

            if(userIndex === -1) {
                throw new Error('유저를 찾을 수 없습니다.');
            }
            //현재 유저
            const user = users[userIndex];
            //새로운 비밀번호 해시
            const salt = bcrypt.genSaltSync(10);
            const encryptedPassword = bcrypt.hashSync(password, salt);
            user.password = encryptedPassword;
            
            users[userIndex] = user;
            fs.writeFileSync(this.filePath, JSON.stringify(users, null, 2), 'utf8');

            return user;
        }catch(error) {
            console.log(error);
            throw new InternalServerError();
        }
    }
    //이메일 중복 확인
    existsByEmail(email) {
        try {
            const users = this.findAll();
            const user = users.find(user => user.email === email); 
            return user !== undefined;
        }catch(error) {
            throw new InternalServerError();
        }
    }
    //닉네임 중복 확인
    existsByNickname(nickname) {
        try {
            const users = this.findAll();
            const user = users.find(user => user.nickname === nickname); 
            return user !== undefined;
        }catch(error) {
            throw new InternalServerError();
        }
    }
    //비밀번호 변경시 기존 암호가 맞는지 확인
    checkPasswordMatch(id, password) {
        try {
            const users = this.findAll();
            const user = users.find(user => Number(user.id) === Number(id) && bcrypt.compareSync(password, user.password));
            return user !== undefined;
        }catch(error) {
            throw new InternalServerError();
        }
    }
}

module.exports = new User();