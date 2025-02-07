FROM node:20.18.2-alpine

WORKDIR /usr/src/app

# package.json package-lock.json 복사
COPY package.json package-lock.json ./

# 의존성 설치
RUN npm install

# 애플리케이션 코드 복사
COPY . .

# 포트 노출 시키기
EXPOSE 8080

# 애플리케이션 실행
CMD ["node", "app.js"]