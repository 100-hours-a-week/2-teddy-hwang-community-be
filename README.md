# 🧸 Teddy's House
## 📋 프로젝트 소개
> 카카오 테크 부트캠프 클라우드 네이티브 제주 2기 커뮤니티 과제<br>
개발기간: 2024.11 ~ 2025.02

## 🛫 시작 가이드
### 설치 및 실행
1. git clone
``` shell 
git clone https://github.com/100-hours-a-week/2-teddy-hwang-community-be.git
```

2. 폴더 이동
``` shell 
cd 2-teddy-hwang-community-be
```

3. 의존성 설치
``` shell
npm install
```

4. 환경 변수 파일 작성 `.env`
프로젝트 실행을 위해 루트 디렉토리에 `.env` 파일을 생성하고 아래 내용을 입력해주세요.
```plaintext
# 서버 포트
PORT=8080

# CORS 설정
CORS_ORIGIN=http://localhost:3000
CORS_EC2=http://ec2_ip:3000

# AWS S3 설정
S3_ACCESS_KEY=your_aws_access_key                  # AWS IAM 액세스 키
S3_SECRET_ACCESS_KEY=your_aws_secret_access_key    # AWS IAM 시크릿 키
S3_REGION=ap-northeast-2                           # AWS 리전
S3_BUCKET_NAME=your_bucket_name                    # S3 버킷 이름

# 데이터베이스 설정
DB_HOST=localhost          # DB 호스트
DB_USER=root              # DB 사용자
DB_PASSWORD=password      # DB 비밀번호
DB_PORT=3306             # DB 포트
DB_NAME=community        # DB 이름

# JWT 설정
JWT_ACCESS_SECRET=your_access_secret_key           # Access Token 비밀키 (임의의 문자열)
JWT_REFRESH_SECRET=your_refresh_secret_key         # Refresh Token 비밀키 (임의의 문자열)

# 토큰 만료 시간 설정
ACCESS_TOKEN_EXPIRES=1h   # Access Token 만료 시간 (1시간)
REFRESH_TOKEN_EXPIRES=14d # Refresh Token 만료 시간 (14일)

# 쿠키 설정
COOKIE_SECRET=your_cookie_secret_key               # 쿠키 암호화 키 (임의의 문자열)
```

5. DB 테이블 생성
- USERS
``` sql
create table users
(
    user_id       int auto_increment
        primary key,
    email         varchar(255)         not null,
    password      varchar(255)         not null,
    nickname      varchar(255)         not null,
    profile_image varchar(255)         not null,
    is_deleted    tinyint(1) default 0 not null
);

create index idx_users_email
    on users (email);

create index idx_users_nickname
    on users (nickname);
```
- POSTS
``` sql
create table posts
(
    post_id       int auto_increment
        primary key,
    title         varchar(255)         not null,
    content       longtext             not null,
    image         varchar(255)         null,
    created_at    varchar(255)         null,
    modified_at   varchar(255)         null,
    like_count    int                  not null,
    view_count    int                  not null,
    comment_count int                  not null,
    user_id       int                  not null,
    is_deleted    tinyint(1) default 0 not null,
    constraint posts_ibfk_1
        foreign key (user_id) references users (user_id)
);

create index user_id
    on posts (user_id);
```
- COMMENTS
``` sql
create table comments
(
    comment_id  int auto_increment
        primary key,
    content     text                 not null,
    created_at  varchar(255)         null,
    modified_at varchar(255)         null,
    user_id     int                  not null,
    post_id     int                  not null,
    is_deleted  tinyint(1) default 0 not null,
    constraint comments_ibfk_1
        foreign key (user_id) references users (user_id),
    constraint comments_ibfk_2
        foreign key (post_id) references posts (post_id)
);

create index post_id
    on comments (post_id);

create index user_id
    on comments (user_id);
```
- LIKES
``` sql
create table likes
(
    like_id int auto_increment
        primary key,
    user_id int not null,
    post_id int not null,
    constraint likes_ibfk_1
        foreign key (user_id) references users (user_id),
    constraint likes_ibfk_2
        foreign key (post_id) references posts (post_id)
);

create index post_id
    on likes (post_id);

create index user_id
    on likes (user_id);
```
- REFRESH_TOKENS
``` sql
create table refresh_tokens
(
    id         int auto_increment
        primary key,
    user_id    int                                  not null,
    token      varchar(500)                         not null,
    is_revoked tinyint(1) default 0                 null,
    expired_at timestamp                            null,
    created_at timestamp  default CURRENT_TIMESTAMP null,
    constraint refresh_tokens_ibfk_1
        foreign key (user_id) references users (user_id)
);

create index idx_token
    on refresh_tokens (token);

create index idx_user_token
    on refresh_tokens (user_id, token);
```
6. 실행
``` shell
node app.js
```
### 📃 [프론트엔드 레포지토리](https://github.com/100-hours-a-week/2-teddy-hwang-community-fe)

## 🛠️ 기술 스택
<img src="https://img.shields.io/badge/node.js-339933?style=for-the-badge&logo=Node.js&logoColor=white"> <img src="https://img.shields.io/badge/express-000000?style=for-the-badge&logo=express&logoColor=white"> <img src="https://img.shields.io/badge/mysql-4479A1?style=for-the-badge&logo=mysql&logoColor=white"> <img src="https://img.shields.io/badge/Amazon RDS-527FFF?style=for-the-badge&logo=Amazon RDS&logoColor=white"> <img src="https://img.shields.io/badge/Amazon S3-569A31?style=for-the-badge&logo=AMAZON S3&logoColor=white">

## 💾 ERD
![erd](https://github.com/user-attachments/assets/12322a70-1392-493d-8664-0890747f57fa)


## 📚 주요 기능
### 🙆‍♂️ 유저
- 회원가입
- 로그인
- 회원 정보 수정
- 비밀번호 수정
- 로그아웃
### 📝 게시글
- 게시글 작성, 조회, 수정, 삭제
- 좋아요
### 💭 댓글
- 댓글 작성, 조회, 수정, 삭제

## 📁 프로젝트 구조
```
📦 back
├─ .github
│  └─ ISSUE_TEMPLATE
│     └─ 버그-리포트-이슈.md
├─ .gitignore
├─ .prettierignore
├─ README.md
├─ app.js
├─ config
│  ├─ dbConfig.js
│  ├─ jwtConfig.js
│  └─ s3Config.js
├─ controllers
│  ├─ authController.js
│  ├─ commentController.js
│  ├─ likeController.js
│  ├─ postController.js
│  └─ userController.js
├─ eslint.config.js
├─ middleware
│  ├─ auth.js
│  ├─ customError.js
│  └─ viewCount.js
├─ model
│  ├─ Comment.js
│  ├─ Like.js
│  ├─ Post.js
│  ├─ RefreshToken.js
│  └─ User.js
├─ package-lock.json
├─ package.json
├─ prettier.config.js
├─ routes
│  ├─ authRoutes.js
│  ├─ commentRoutes.js
│  ├─ likeRoutes.js
│  ├─ postRoutes.js
│  └─ userRoutes.js
└─ utils
   └─ validation.js
```
