const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload file to Cloudinary
 * @param {string} filePath - Local file path
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<string>} - Cloudinary URL
 */
async function uploadToCloudinary(filePath, folder = 'travel-ai/profiles') {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: folder,
    resource_type: 'auto',
    transformation: [
      { width: 500, height: 500, crop: 'fill' },
      { quality: 'auto' }
    ]
  });
  return result.secure_url;
}

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 */
async function deleteFromCloudinary(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    // Silent fail - file might not exist
    console.error('Cloudinary delete error:', error.message);
  }
}

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} - Public ID or null
 */
function extractPublicId(url) {
  if (!url) return null;
  
  // URL format: https://res.cloudinary.com/cloud/image/upload/v123/folder/image.jpg
  const regex = /\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/;
  const match = url.match(regex);
  
  return match ? match[1] : null;
}

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicId
};
