const express = require('express');
const multer = require('multer');
const { authenticateToken } = require('../middleware/auth');
const { uploadToS3, generatePresignedUrl } = require('../services/s3');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    
    // Check file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(fileExtension)) {
      return cb(new Error('Only JPG, JPEG, PNG, GIF, and WebP files are allowed'));
    }
    
    cb(null, true);
  }
});

// Upload profile image directly to S3
router.post('/profile-image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No image file provided'
      });
    }
    
    // Upload to S3
    const result = await uploadToS3(req.file, 'profiles');
    
    res.json({
      message: 'Image uploaded successfully',
      url: result.url,
      key: result.key
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    if (error.message.includes('File too large')) {
      return res.status(413).json({
        error: 'Payload Too Large',
        message: 'File size too large. Maximum size is 5MB'
      });
    }
    
    if (error.message.includes('Only image files are allowed')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Only image files are allowed'
      });
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to upload image'
    });
  }
});

// Generate presigned URL for direct upload from frontend
router.post('/presigned-url', authenticateToken, async (req, res) => {
  try {
    const { fileName, fileType } = req.body;
    
    if (!fileName || !fileType) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'fileName and fileType are required'
      });
    }
    
    // Validate file type
    if (!fileType.startsWith('image/')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Only image files are allowed'
      });
    }
    
    // Generate presigned URL
    const result = await generatePresignedUrl(fileName, fileType);
    
    res.json({
      message: 'Presigned URL generated successfully',
      uploadUrl: result.uploadUrl,
      key: result.key,
      publicUrl: result.publicUrl
    });
  } catch (error) {
    console.error('Generate presigned URL error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate presigned URL'
    });
  }
});

// Handle multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'Payload Too Large',
        message: 'File size too large. Maximum size is 5MB'
      });
    }
  }
  
  if (error.message.includes('Only image files are allowed')) {
    return res.status(400).json({
      error: 'Bad Request',
      message: error.message
    });
  }
  
  next(error);
});

module.exports = router;