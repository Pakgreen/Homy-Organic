import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Extract public_id from Cloudinary URL
 * Example: https://res.cloudinary.com/demo/image/upload/v1234567890/folder/sample.jpg
 * Returns: folder/sample
 */
export function extractPublicId(url: string): string | null {
  try {
    if (!url || !url.includes('cloudinary.com')) {
      return null;
    }

    const parts = url.split('/');
    const uploadIndex = parts.findIndex(part => part === 'upload');
    
    if (uploadIndex === -1) return null;
    
    // Get everything after 'upload/' (skipping version if present)
    let startIndex = uploadIndex + 1;
    
    // Skip version number if present (starts with 'v' followed by digits)
    if (parts[startIndex] && parts[startIndex].match(/^v\d+$/)) {
      startIndex++;
    }
    
    // Get all parts from startIndex to end
    const publicIdParts = parts.slice(startIndex);
    
    // Join and remove file extension
    const fullPath = publicIdParts.join('/');
    const publicId = fullPath.replace(/\.[^/.]+$/, ''); // Remove extension
    
    return publicId;
  } catch (error) {
    console.error('Error extracting public_id:', error);
    return null;
  }
}

/**
 * Delete image from Cloudinary
 */
export async function deleteFromCloudinary(url: string): Promise<boolean> {
  try {
    const publicId = extractPublicId(url);
    
    if (!publicId) {
      console.error('Could not extract public_id from URL:', url);
      return false;
    }

    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      console.log('✅ Image deleted from Cloudinary:', publicId);
      return true;
    } else {
      console.warn('⚠️ Cloudinary delete result:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Error deleting from Cloudinary:', error);
    return false;
  }
}

/**
 * Delete multiple images from Cloudinary
 */
export async function deleteMultipleFromCloudinary(urls: string[]): Promise<number> {
  let deletedCount = 0;
  
  for (const url of urls) {
    if (url && url.includes('cloudinary.com')) {
      const success = await deleteFromCloudinary(url);
      if (success) deletedCount++;
    }
  }
  
  return deletedCount;
}

export default cloudinary;
