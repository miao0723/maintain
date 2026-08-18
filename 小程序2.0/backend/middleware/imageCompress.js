const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * 压缩图片中间件
 * @param {Object} file - 上传的文件对象
 * @param {Object} options - 压缩选项
 * @returns {Promise<Object>} 压缩后的文件信息
 */
async function compressImage(file, options = {}) {
  const {
    maxWidth = 200,
    maxHeight = 200,
    quality = 80,
    format = 'jpeg',
    fit = 'cover'
  } = options;

  try {
    const inputPath = file.path;
    const filename = file.filename;
    const uploadDir = path.dirname(inputPath);
    
    // 生成压缩后的文件名
    const compressedFilename = `compressed-${filename.replace(/\.[^.]+$/, '')}.${format}`;
    const compressedPath = path.join(uploadDir, compressedFilename);

    // 使用sharp进行压缩
    let transform = sharp(inputPath)
      .resize(maxWidth, maxHeight, {
        fit,
        position: 'center'
      });

    // 根据格式设置质量
    if (format === 'jpeg') {
      transform = transform.jpeg({ quality });
    } else if (format === 'png') {
      transform = transform.png({ quality });
    } else if (format === 'webp') {
      transform = transform.webp({ quality });
    }

    // 保存压缩后的图片
    await transform.toFile(compressedPath);

    // 获取文件大小
    const originalStats = fs.statSync(inputPath);
    const compressedStats = fs.statSync(compressedPath);

    console.log(`图片压缩完成:`, {
      original: `${(originalStats.size / 1024).toFixed(2)} KB`,
      compressed: `${(compressedStats.size / 1024).toFixed(2)} KB`,
      ratio: `${((1 - compressedStats.size / originalStats.size) * 100).toFixed(2)}% 压缩率`
    });

    // 删除原始文件
    fs.unlinkSync(inputPath);

    return {
      ...file,
      filename: compressedFilename,
      path: compressedPath,
      size: compressedStats.size
    };
  } catch (error) {
    console.error('图片压缩失败:', error);
    throw error;
  }
}

/**
 * Multer存储引擎，包含自动压缩
 */
const createCompressedStorage = (uploadDir) => {
  return {
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, req.user?.userId + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  };
};

module.exports = {
  compressImage,
  createCompressedStorage
};
