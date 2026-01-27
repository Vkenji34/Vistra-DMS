import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient, ItemType } from '@prisma/client';
import fs from 'fs';

const router: ExpressRouter = Router();
const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
});

router.post(
  '/upload',
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          code: 'NO_FILE',
          message: 'No file uploaded',
        });
      }

      const { parentId, createdBy } = req.body;

      if (parentId) {
        const parent = await prisma.item.findUnique({
          where: { id: parentId },
        });
        if (!parent || parent.type !== 'FOLDER') {
          fs.unlinkSync(req.file.path);
          return res.status(404).json({
            code: 'NOT_FOUND',
            message: 'Parent folder not found',
          });
        }
      }

      const fileName = req.body.name || req.file.originalname;
      const fileExtension = path.extname(req.file.originalname).slice(1);
      const fileSizeBytes = req.file.size;
      const mimeType = req.file.mimetype;

      const existing = await prisma.item.findFirst({
        where: {
          parentId: parentId || null,
          name: fileName,
          type: 'DOCUMENT',
        },
      });

      if (existing) {
        fs.unlinkSync(req.file.path);
        return res.status(409).json({
          code: 'DUPLICATE_NAME',
          message: 'A document with this name already exists in this location',
        });
      }

      const document = await prisma.item.create({
        data: {
          type: 'DOCUMENT',
          name: fileName,
          parentId: parentId || null,
          createdBy: createdBy || 'Anonymous',
          fileSizeBytes: BigInt(fileSizeBytes),
          mimeType,
          extension: fileExtension,
        },
        select: {
          id: true,
          type: true,
          name: true,
          parentId: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
          fileSizeBytes: true,
          mimeType: true,
          extension: true,
        },
      });

      const fileRecordPath = path.join(process.cwd(), 'uploads', '.file_records');
      if (!fs.existsSync(fileRecordPath)) {
        fs.writeFileSync(fileRecordPath, JSON.stringify({}, null, 2));
      }
      const fileRecords = JSON.parse(fs.readFileSync(fileRecordPath, 'utf-8'));
      fileRecords[document.id] = {
        originalName: req.file.originalname,
        storedName: path.basename(req.file.path),
        path: req.file.path,
      };
      fs.writeFileSync(fileRecordPath, JSON.stringify(fileRecords, null, 2));

      const serializedDoc = {
        ...document,
        fileSizeBytes: document.fileSizeBytes ? Number(document.fileSizeBytes) : null,
      };

      res.status(201).json(serializedDoc);
    } catch (error) {
      console.error('Error uploading file:', error);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to upload file',
      });
    }
  }
);

router.get('/upload/:id/download', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const item = await prisma.item.findUnique({
      where: { id },
    });

    if (!item) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Document not found',
      });
    }

    if (item.type !== 'DOCUMENT') {
      return res.status(400).json({
        code: 'INVALID_TYPE',
        message: 'Cannot download a folder',
      });
    }

    const fileRecordPath = path.join(process.cwd(), 'uploads', '.file_records');
    if (!fs.existsSync(fileRecordPath)) {
      return res.status(404).json({
        code: 'FILE_NOT_FOUND',
        message: 'File record not found',
      });
    }

    const fileRecords = JSON.parse(fs.readFileSync(fileRecordPath, 'utf-8'));
    const fileRecord = fileRecords[id];

    if (!fileRecord || !fs.existsSync(fileRecord.path)) {
      return res.status(404).json({
        code: 'FILE_NOT_FOUND',
        message: 'File not found on disk',
      });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${fileRecord.originalName}"`);
    res.setHeader('Content-Type', item.mimeType || 'application/octet-stream');

    const fileStream = fs.createReadStream(fileRecord.path);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to download file',
    });
  }
});

export { router as uploadRouter };
