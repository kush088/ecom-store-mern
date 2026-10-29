
import { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import { upload, uploadVideo } from '../middleware/upload.js';
import {
  uploadBuffer,
  removeImage,
  uploadVideoBuffer,
  removeVideo,
} from '../config/cloudinary.js';
import { asyncHandler } from '../middleware/error.js';

const router = Router();

router.use(protect, adminOnly);

// Upload multiple images
router.post(
  '/',
  upload.array('images', 8),
  asyncHandler(async (req, res) => {
    if (!req.files?.length) {
      return res.status(400).json({ message: 'No images uploaded' });
    }

    const results = await Promise.all(
      req.files.map((file) => uploadBuffer(file.buffer))
    );

    res.status(201).json(results);
  })
);

// Upload homepage promotional video
router.post(
  '/video',
  uploadVideo.single('video'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No video uploaded' });
    }

    const result = await uploadVideoBuffer(req.file.buffer);

    res.status(201).json(result);
  })
);

// Delete an image
router.delete(
  '/',
  asyncHandler(async (req, res) => {
    if (req.body.publicId) {
      await removeImage(req.body.publicId);
    }

    res.json({ ok: true });
  })
);

// Delete a video
router.delete(
  '/video',
  asyncHandler(async (req, res) => {
    if (req.body.publicId) {
      await removeVideo(req.body.publicId);
    }

    res.json({ ok: true });
  })
);

export default router;
