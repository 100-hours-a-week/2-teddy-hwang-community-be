const { S3Client, } = require('@aws-sdk/client-s3');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const uuid = require('uuid4');
const { BadRequest } = require('../middleware/customError');

// S3 클라이언트 설정
const s3Client = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

// CloudFront URL 생성 함수
const getCloudFrontUrl = (s3Url) => {
  if(!s3Url) return '';
  const key = s3Url.split('/').slice(3).join('/');
  return `${process.env.CLOUDFRONT_DOMAIN}/${key}`;
}

// 파일 업로더 생성함수
const createUploader = folder => {
  return multerS3({
    s3: s3Client,
    bucket: process.env.S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const originalFilename = Buffer.from(
        file.originalname,
        'latin1',
      ).toString('utf8');
      const lastDotIndex = originalFilename.lastIndexOf('.');
      const filename = originalFilename.substring(0, lastDotIndex);
      const fileExtension = file.originalname.split('.').pop();
      const key = `${folder}/${Date.now()}-${uuid()}-${filename}.${fileExtension}`;

      // key를 request 객체에 저장하여 나중에 URL 생성에 사용
      req.fileKey = key;
      cb(null, key);
    },
    metadata: (req, file, cb) => {
      cb(null, {fieldName: file.fieldname});
    },
  });
};

const postUpload = multer({
  storage: createUploader('posts'),
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1 // 단일 파일 허용
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new BadRequest('이미지 파일만 업로드 가능합니다.'), false);
    }
    cb(null, true);
  },
});

const userUpload = multer({
  storage: createUploader('users'),
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1 // 단일 파일 허용 
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new BadRequest('이미지 파일만 업로드 가능합니다.'), false);
    }
    cb(null, true);
  },
});

const deleteImage = async fileKey => {
  if (!fileKey) return;

  try {
    // CloudFront URL에서 key 추출
    const key = fileKey.replace(`${process.env.CLOUDFRONT_DOMAIN}/`, '');

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    };

    await s3Client.send(new DeleteObjectCommand(params));
    return true;
  } catch (error) {
    console.error('S3 파일 삭제 실패:', error);
    throw error;
  }
};

module.exports = {
  s3Client,
  postUpload,
  userUpload,
  deleteImage,
  getCloudFrontUrl,
};
