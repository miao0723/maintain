const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../uploads/reviews');
const quoteDir = path.join(__dirname, '../uploads/quotes');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('创建上传目录:', uploadDir);
}

if (!fs.existsSync(quoteDir)) {
  fs.mkdirSync(quoteDir, { recursive: true });
  console.log('创建报价文件目录:', quoteDir);
}

// 配置multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'review-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    // 只允许图片文件
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  }
});

// 报价文件存储配置（支持图片和文档）
const quoteStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, quoteDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'quote-' + uniqueSuffix + ext);
  }
});

// 报价文件上传配置
const quoteUpload = multer({
  storage: quoteStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: function (req, file, cb) {
    // 允许图片和文档文件
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|xls|xlsx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error('只允许上传图片或文档文件（jpg, png, pdf, doc, docx, xls, xlsx, txt）'));
    }
  }
});

// 维修记录图片/视频存储配置
const repairDir = path.join(__dirname, '../uploads/repairs');
if (!fs.existsSync(repairDir)) {
  fs.mkdirSync(repairDir, { recursive: true });
  console.log('创建维修文件目录:', repairDir);
}

const repairStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, repairDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'repair-' + uniqueSuffix + ext);
  }
});

// 维修文件上传配置（支持图片、视频和文档）
const repairUpload = multer({
  storage: repairStorage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB，支持视频
  },
  fileFilter: function (req, file, cb) {
    // 允许图片、视频和文档文件
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|mkv|pdf|doc|docx|xls|xlsx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error('只允许上传图片、视频或文档文件（jpg, png, mp4, mov, avi, mkv, pdf, doc, docx, xls, xlsx, txt）'));
    }
  }
});

/**
 * 上传单张图片
 */
router.post('/image', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }

    const fileUrl = `/uploads/reviews/${req.file.filename}`;

    console.log('上传成功:', {
      filename: req.file.filename,
      url: fileUrl,
      size: req.file.size
    });

    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        url: fileUrl,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('上传失败:', error);
    res.status(500).json({
      success: false,
      message: '上传失败',
      error: error.message
    });
  }
});

/**
 * 上传多张图片
 */
router.post('/images', upload.array('files', 3), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }

    const files = req.files.map(file => ({
      filename: file.filename,
      url: `/uploads/reviews/${file.filename}`,
      size: file.size
    }));

    console.log('批量上传成功:', files);

    res.json({
      success: true,
      data: files
    });
  } catch (error) {
    console.error('批量上传失败:', error);
    res.status(500).json({
      success: false,
      message: '批量上传失败',
      error: error.message
    });
  }
});

/**
 * 上传报价文件（支持图片和文档）
 */
router.post('/quote', quoteUpload.array('files', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }

    const files = req.files.map(file => {
      // 判断文件类型
      const ext = path.extname(file.originalname).toLowerCase();
      const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
      const isPdf = ext === '.pdf';

      return {
        filename: file.filename,
        url: `/uploads/quotes/${file.filename}`,
        originalName: file.originalname,
        size: file.size,
        type: isImage ? 'image' : isPdf ? 'pdf' : 'document'
      };
    });

    console.log('报价文件上传成功:', files);

    res.json({
      success: true,
      data: files
    });
  } catch (error) {
    console.error('报价文件上传失败:', error);
    res.status(500).json({
      success: false,
      message: '上传失败',
      error: error.message
    });
  }
});

/**
 * 上传维修记录文件（支持图片和视频）
 */
router.post('/repair', repairUpload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }

    const files = req.files.map(file => {
      // 判断文件类型
      const ext = path.extname(file.originalname).toLowerCase();
      const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
      const isVideo = ['.mp4', '.mov', '.avi', '.mkv'].includes(ext);
      const isPdf = ext === '.pdf';

      return {
        filename: file.filename,
        url: `/uploads/repairs/${file.filename}`,
        originalName: file.originalname,
        size: file.size,
        type: isImage ? 'image' : isVideo ? 'video' : isPdf ? 'pdf' : 'document'
      };
    });

    console.log('维修记录文件上传成功:', files);

    res.json({
      success: true,
      data: files
    });
  } catch (error) {
    console.error('维修记录文件上传失败:', error);
    res.status(500).json({
      success: false,
      message: '上传失败',
      error: error.message
    });
  }
});

module.exports = router;
