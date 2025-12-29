import multer from 'multer';
import path from 'path';

// Configure multer for file uploads
const storage = multer.memoryStorage();

// File filter for allowed types
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowedTypes = {
    'image/jpeg': true,
    'image/png': true,
    'image/gif': true,
    'image/webp': true,
    'audio/wav': true,
    'audio/mp3': true,
    'audio/mpeg': true,
    'audio/ogg': true,
    'video/mp4': true,
    'video/webm': true,
    'video/mov': true,
    'video/avi': true
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

// Configure upload limits
const limits = {
  fileSize: 100 * 1024 * 1024, // 100MB max file size
  files: 5 // Max 5 files per request
};

// Create multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits
});

// Single file upload middleware
export const uploadSingle = (fieldName: string) => upload.single(fieldName);

// Multiple files upload middleware
export const uploadMultiple = (fieldName: string, maxCount: number = 5) => upload.array(fieldName, maxCount);

// Custom file upload handler with validation
export const validateUpload = (allowedTypes: string[], maxSize: number = 100 * 1024 * 1024) => {
  return multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}`));
      }
    },
    limits: {
      fileSize: maxSize
    }
  });
};