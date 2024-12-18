const { S3Client } = require('@aws-sdk/client-s3');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const uuid = require('uuid4');
const { BadRequest } = require('../middleware/customError');

const s3Client = new S3Client({
    region: process.env.S3_REGION,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
    } 
});

const createUploader = (folder) => {
    return multerS3({
        s3: s3Client,
        bucket: process.env.S3_BUCKET_NAME,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (req, file, cb) => {
            const originalFilename = Buffer.from(file.originalname, 'latin1').toString('utf8');
            const lastDotIndex = originalFilename.lastIndexOf('.');
            const filename = originalFilename.substring(0, lastDotIndex);
            const fileExtension = file.originalname.split('.').pop();
            cb(null, `${folder}/${Date.now()}-${uuid()}-${filename}.${fileExtension}`);
        }
    });
};

const postUpload = multer({
    storage: createUploader('posts'),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new BadRequest('이미지 파일만 업로드 가능합니다.'), false);
        }
        cb(null, true);
    }
});

const userUpload = multer({
    storage: createUploader('users'),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new BadRequest('이미지 파일만 업로드 가능합니다.'), false);
        }
        cb(null, true);
    }
});

const deleteImage = async (fileKey) => {
    if (!fileKey) return;
    
    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileKey
    };
 
    try {
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
    deleteImage
};