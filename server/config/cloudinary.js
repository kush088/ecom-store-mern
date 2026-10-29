
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload images to Cloudinary
export const uploadBuffer = (buffer, folder = 'jewellery') =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (err, result) => {
        if (err) return reject(err);

        if (!result) {
          return reject(new Error('Image upload failed'));
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    stream.end(buffer);
  });

// Upload product videos to Cloudinary
export const uploadVideoBuffer = (
  buffer,
  folder = 'jewellery/videos'
) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'video',
      },
      (err, result) => {
        if (err) return reject(err);

        if (!result) {
          return reject(new Error('Video upload failed'));
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    stream.end(buffer);
  });

// Delete an image from Cloudinary
export const removeImage = (publicId) =>
  cloudinary.uploader.destroy(publicId, {
    resource_type: 'image',
  });

// Delete a video from Cloudinary
export const removeVideo = (publicId) =>
  cloudinary.uploader.destroy(publicId, {
    resource_type: 'video',
  });

export default cloudinary;
