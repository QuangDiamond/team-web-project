import multer from 'multer';
import { Buffer } from 'node:buffer';
import { AppError } from '../utils/AppError.js';

// config max size theo br
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

// zip signature để check xem file đc gửi lên có phải file zip hay ko :))).
const ZIP_SIGNATURES = [
  [0x50, 0x4b, 0x03, 0x04],
  [0x50, 0x4b, 0x05, 0x06],
  [0x50, 0x4b, 0x07, 0x08],
];

const ALLOWED_FILE_TYPES = {
  '.pdf': ['application/pdf'],
  '.doc': ['application/msword', 'application/octet-stream'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/octet-stream'],
  '.ppt': ['application/vnd.ms-powerpoint', 'application/octet-stream'],
  '.pptx': ['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/octet-stream'],
  '.xls': ['application/vnd.ms-excel', 'application/octet-stream'],
  '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/octet-stream'],
  '.jpg': ['image/jpeg'],
  '.png': ['image/png'],
  '.mp4': ['video/mp4', 'application/octet-stream'],
  '.zip': ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'],
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1, fields: 5, fieldSize: 16 * 1024 },
  fileFilter: (_req, file, callback) => {
    const fileName = file.originalname.toLowerCase();
    const extension = fileName.slice(fileName.lastIndexOf('.'));
    const allowedMimeTypes = ALLOWED_FILE_TYPES[extension];

    if (!allowedMimeTypes || !allowedMimeTypes.includes(file.mimetype)) {
      callback(new AppError('File type is not allowed. Allowed types: pdf, doc/docx, ppt/pptx, xls/xlsx, jpg, png, mp4, zip', 422));
      return;
    }

    callback(null, true);
  },
});

/**
 * Receive and validate one class material file
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
export const uploadClassMaterialFile = (req, res, next) => {
  upload.single('file')(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      next(new AppError('File must be 20 MB or smaller', 413));
      return;
    }

    if (error instanceof multer.MulterError) {
      next(new AppError(error.message, 422));
      return;
    }

    next(error);
  });
};

/**
 * Require a file after multipart fields have been validated
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
export const requireClassMaterialFile = (req, res, next) => {
  if (req.body.material_type === 'LINK') {
    if (req.file) {
      next(new AppError('A link material must not include a file', 422));
      return;
    }
    if (!req.body.file_url) {
      next(new AppError('A URL is required for link material', 422));
      return;
    }
    next();
    return;
  }

  if (!req.file) {
    next(new AppError('A file is required for this material type', 422));
    return;
  }
  next();
};

/**
 * Check the uploaded file's leading bytes against its extension
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
export const validateClassMaterialFileContent = (req, res, next) => {
  if (req.body.material_type === 'LINK') {
    next();
    return;
  }

  const file = req.file;
  const extension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
  const buffer = file.buffer;
  let isValidContent = false;

  if (extension === '.pdf') {
    isValidContent = buffer.subarray(0, 5).toString() === '%PDF-';
  } else if (['.doc', '.ppt', '.xls'].includes(extension)) {
    isValidContent = buffer.subarray(0, 4).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0]));
  } else if (['.docx', '.pptx', '.xlsx', '.zip'].includes(extension)) {
    isValidContent = ZIP_SIGNATURES.some((signature) => buffer.subarray(0, signature.length).equals(Buffer.from(signature)));
  } else if (extension === '.jpg') {
    isValidContent = buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  } else if (extension === '.png') {
    isValidContent = buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  } else if (extension === '.mp4') {
    isValidContent = buffer.subarray(4, 8).toString() === 'ftyp';
  }

  if (!isValidContent) {
    next(new AppError('The file content does not match its file extension', 422));
    return;
  }

  next();
};
