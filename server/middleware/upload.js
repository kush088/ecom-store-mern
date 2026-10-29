
import multer from 'multer';

const storage = multer.memoryStorage();

// Allow JPG, PNG, and WEBP images.
const imageFilter = (_req, file, cb) => {
  if (/^image\/(jpe?g|png|webp)$/.test(file.mimetype)) {
    return cb(null, true);
  }

  cb(new Error('Only JPG, PNG or WEBP images are allowed'));
};

// Allow MP4, WEBM, and MOV videos.
const videoFilter = (_req, file, cb) => {
  const allowedVideoTypes = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
  ];

  if (allowedVideoTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  cb(new Error('Only MP4, WEBM or MOV videos are allowed'));
};

// Image uploads: maximum 8 files, 5 MB per file.
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 8,
  },
  fileFilter: imageFilter,
});

// Video uploads: one file, maximum 50 MB.
export const uploadVideo = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 1,
  },
  fileFilter: videoFilter,
});
