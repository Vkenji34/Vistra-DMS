export type ItemType = 'FOLDER' | 'DOCUMENT';

export interface Item {
  id: string;
  type: ItemType;
  name: string;
  parentId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  fileSizeBytes?: number | null;
  mimeType?: string | null;
  extension?: string | null;
}

export interface ListItemsParams {
  parentId?: string;
  q?: string;
  type?: ItemType;
}

export interface CreateFolderParams {
  name: string;
  parentId?: string;
  createdBy: string;
}

export interface CreateDocumentParams {
  name: string;
  parentId?: string;
  createdBy: string;
  fileSizeBytes?: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
