import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { PrismaClient, ItemType, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const router: ExpressRouter = Router();


const listItemsQuerySchema = z.object({
  parentId: z.string().optional(),
  q: z.string().optional(),
  type: z.enum(['FOLDER', 'DOCUMENT']).optional(),
});

const createFolderBodySchema = z.object({
  name: z.string().min(1).max(255).trim(),
  parentId: z.string().optional(),
  createdBy: z.string().min(1).max(255),
});

const createDocumentBodySchema = z.object({
  name: z.string().min(1).max(255).trim(),
  parentId: z.string().optional(),
  createdBy: z.string().min(1).max(255),
  fileSizeBytes: z.number().int().nonnegative().optional(),
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const query = listItemsQuerySchema.parse(req.query);

    const where: Prisma.ItemWhereInput = {
      ...(query.parentId ? { parentId: query.parentId } : { parentId: null }),
      ...(query.type ? { type: query.type as ItemType } : {}),
      ...(query.q
        ? {
            name: {
              contains: query.q,
            },
          }
        : {}),
    };

    const items = await prisma.item.findMany({
      where,
      orderBy: [
        { type: 'asc' },
        { name: 'asc' },
      ],
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

    const serializedItems = items.map((item) => ({
      ...item,
      fileSizeBytes: item.fileSizeBytes ? Number(item.fileSizeBytes) : null,
    }));

    res.json(serializedItems);
  } catch (error) {
    console.error('Error listing items:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to list items',
    });
  }
});

router.post('/folders', async (req: Request, res: Response) => {
  try {
    const body = createFolderBodySchema.parse(req.body);

    if (body.parentId) {
      const parent = await prisma.item.findUnique({
        where: { id: body.parentId },
      });
      if (!parent) {
        return res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Parent folder not found',
        });
      }
      if (parent.type !== 'FOLDER') {
        return res.status(400).json({
          code: 'INVALID_PARENT',
          message: 'Parent must be a folder',
        });
      }
    }

    const existing = await prisma.item.findFirst({
      where: {
        parentId: body.parentId || null,
        name: body.name,
        type: 'FOLDER',
      },
    });

    if (existing) {
      return res.status(409).json({
        code: 'DUPLICATE_NAME',
        message: 'A folder with this name already exists in this location',
      });
    }

    const folder = await prisma.item.create({
      data: {
        type: 'FOLDER',
        name: body.name,
        parentId: body.parentId || null,
        createdBy: body.createdBy,
      },
      select: {
        id: true,
        type: true,
        name: true,
        parentId: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json(folder);
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
});

router.post('/documents', async (req: Request, res: Response) => {
  try {
    const body = createDocumentBodySchema.parse(req.body);

    if (body.parentId) {
      const parent = await prisma.item.findUnique({
        where: { id: body.parentId },
      });
      if (!parent) {
        return res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Parent folder not found',
        });
      }
      if (parent.type !== 'FOLDER') {
        return res.status(400).json({
          code: 'INVALID_PARENT',
          message: 'Parent must be a folder',
        });
      }
    }

    const existing = await prisma.item.findFirst({
      where: {
        parentId: body.parentId || null,
        name: body.name,
        type: 'DOCUMENT',
      },
    });

    if (existing) {
      return res.status(409).json({
        code: 'DUPLICATE_NAME',
        message: 'A document with this name already exists in this location',
      });
    }

    const document = await prisma.item.create({
      data: {
        type: 'DOCUMENT',
        name: body.name,
        parentId: body.parentId || null,
        createdBy: body.createdBy,
        fileSizeBytes: body.fileSizeBytes
          ? BigInt(body.fileSizeBytes)
          : null,
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

    const serializedDoc = {
      ...document,
      fileSizeBytes: document.fileSizeBytes
        ? Number(document.fileSizeBytes)
        : null,
    };

    res.status(201).json(serializedDoc);
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
});

async function deleteDocument(itemId: string): Promise<void> {
  const fs = await import('fs');
  const path = await import('path');
  
  const fileRecordPath = path.join(process.cwd(), 'uploads', '.file_records');
  
  if (fs.existsSync(fileRecordPath)) {
    const fileRecords = JSON.parse(fs.readFileSync(fileRecordPath, 'utf-8'));
    const fileRecord = fileRecords[itemId];
    
    if (fileRecord && fs.existsSync(fileRecord.path)) {
      fs.unlinkSync(fileRecord.path);
    }
    
    delete fileRecords[itemId];
    fs.writeFileSync(fileRecordPath, JSON.stringify(fileRecords, null, 2));
  }
  
  await prisma.item.delete({
    where: { id: itemId },
  });
}

async function deleteFolderRecursive(itemId: string): Promise<void> {
  const children = await prisma.item.findMany({
    where: { parentId: itemId },
    select: { id: true, type: true },
  });
  
  for (const child of children) {
    if (child.type === 'FOLDER') {
      await deleteFolderRecursive(child.id);
    } else {
      await deleteDocument(child.id);
    }
  }
  
  await prisma.item.delete({
    where: { id: itemId },
  });
}

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const item = await prisma.item.findUnique({
      where: { id },
    });
    
    if (!item) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Item not found',
      });
    }
    
    if (item.type === 'FOLDER') {
      const childrenCount = await prisma.item.count({
        where: { parentId: id },
      });
      
      if (childrenCount > 0) {
        await deleteFolderRecursive(id);
      } else {
        await prisma.item.delete({
          where: { id },
        });
      }
    } else {
      await deleteDocument(id);
    }
    
    res.status(200).json({
      success: true,
      message: `${item.type === 'FOLDER' ? 'Folder' : 'Document'} deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to delete item',
    });
  }
});

export { router as itemsRouter };
