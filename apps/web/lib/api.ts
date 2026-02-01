import axios from 'axios';
import type { Item, ListItemsParams, CreateFolderParams, CreateDocumentParams } from 'shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function listItems(params?: ListItemsParams): Promise<Item[]> {
  const response = await api.get<Item[]>('/api/items', {
    params,
  });
  return response.data;
}

export async function createFolder(params: CreateFolderParams): Promise<Item> {
  const response = await api.post<Item>('/api/items/folders', params);
  return response.data;
}

export async function createDocument(params: CreateDocumentParams): Promise<Item> {
  const response = await api.post<Item>('/api/items/documents', params);
  return response.data;
}

export interface UploadFileParams {
  file: File;
  name?: string;
  parentId?: string;
  createdBy: string;
}

export async function uploadFile(params: UploadFileParams): Promise<Item> {
  const formData = new FormData();
  formData.append('file', params.file);
  if (params.name) {
    formData.append('name', params.name);
  }
  if (params.parentId) {
    formData.append('parentId', params.parentId);
  }
  formData.append('createdBy', params.createdBy);

  const response = await api.post<Item>('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function downloadFile(itemId: string): Promise<void> {
  const response = await api.get(`/api/upload/${itemId}/download`, {
    responseType: 'blob',
  });
  
  const contentDisposition = response.headers['content-disposition'];
  let filename = 'download';
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="(.+)"/);
    if (match) {
      filename = match[1];
    }
  }
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function deleteItem(itemId: string): Promise<void> {
  await api.delete(`/api/items/${itemId}`);
}

export async function deleteItems(ids: string[]): Promise<{ deleted: { folders: number; documents: number } }> {
  const response = await api.post<{ deleted: { folders: number; documents: number } }>('/api/items/delete-bulk', { ids });
  return response.data;
}

export default api;
