import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_URL?.split('@')[1],
  api_key: process.env.CLOUDINARY_URL?.split(':')[1]?.split('//')[1],
  api_secret: process.env.CLOUDINARY_URL?.split(':')[2]?.split('@')[0],
});

const CloudinaryModule = {
  uploadImage: async (filePath: string, publicId?: string) => {
    try {
      const uploadResult = await cloudinary.uploader.upload(filePath, {
        public_id: publicId,
      });
      return uploadResult;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  },

  uploadVideo: async (filePath: string, publicId?: string) => {
    try {
      const uploadResult = await cloudinary.uploader.upload(filePath, {
        public_id: publicId,
        resource_type: 'video',
        chunk_size: 6000000, // 6MB chunks for large videos
      });
      return uploadResult;
    } catch (error) {
      console.error("Error uploading video:", error);
      throw error;
    }
  },



  generateOptimizedUrl: (publicId: string) => {
    return cloudinary.url(publicId, {
      fetch_format: 'auto',
      quality: 'auto',
    });
  },

  generateAutoCropUrl: (publicId: string, width: number, height: number) => {
    return cloudinary.url(publicId, {
      crop: 'auto',
      gravity: 'auto',
      width,
      height,
    });
  },

  generateVideoUrl: (publicId: string, options?: any) => {
    return cloudinary.url(publicId, {
      resource_type: 'video',
      ...options
    });
  },

  deleteResource: async (publicId: string, resourceType: 'image' | 'video' = 'image') => {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType
      });
      return result;
    } catch (error) {
      console.error(`Error deleting ${resourceType}:`, error);
      throw error;
    }
  },
};

export default CloudinaryModule;