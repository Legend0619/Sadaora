const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

const uploadToS3 = async (file, folder = 'profiles') => {
  const fileExtension = file.originalname.split('.').pop();
  const fileName = `${folder}/${uuidv4()}.${fileExtension}`;
  
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read'
  };
  
  try {
    const result = await s3.upload(params).promise();
    return {
      url: result.Location,
      key: result.Key
    };
  } catch (error) {
    throw new Error(`Failed to upload to S3: ${error.message}`);
  }
};

const deleteFromS3 = async (key) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key
  };
  
  try {
    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error('Failed to delete from S3:', error);
    return false;
  }
};

// Generate presigned URL for direct upload from frontend
const generatePresignedUrl = async (fileName, fileType) => {
  const fileExtension = fileName.split('.').pop();
  const key = `profiles/${uuidv4()}.${fileExtension}`;
  
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Expires: 60 * 5, // 5 minutes
    ContentType: fileType,
    ACL: 'public-read'
  };
  
  try {
    const url = await s3.getSignedUrlPromise('putObject', params);
    return {
      uploadUrl: url,
      key: key,
      publicUrl: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
    };
  } catch (error) {
    throw new Error(`Failed to generate presigned URL: ${error.message}`);
  }
};

module.exports = {
  uploadToS3,
  deleteFromS3,
  generatePresignedUrl
};