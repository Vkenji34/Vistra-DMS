'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listItems, createFolder, uploadFile, downloadFile, deleteItem, deleteItems } from '@/lib/api';
import type { Item, ListItemsParams } from 'shared';
import { Folder, FileText, Plus, Search, Upload, Loader2, Download, File, Trash2, X } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [parentId, setParentId] = useState<string | undefined>();
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const { data: items, isLoading, error } = useQuery({
    queryKey: ['items', { parentId, q: searchQuery, page, pageSize }],
    queryFn: () => listItems({ parentId, q: searchQuery }),
  });

  // Reset page when search or parent changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, parentId]);

  const queryClient = useQueryClient();

  const createFolderMutation = useMutation({
    mutationFn: createFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setShowFolderModal(false);
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setShowDocModal(false);
      setUploadError(null);
    },
    onError: (err: Error) => {
      setUploadError(err.message);
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setShowDeleteModal(false);
      setItemToDelete(null);
    },
  });

  const deleteItemsMutation = useMutation({
    mutationFn: deleteItems,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setShowBulkDeleteModal(false);
      setSelectedItems(new Set());
    },
  });

  const handleSelectItem = useCallback((id: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (items && selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else if (items) {
      setSelectedItems(new Set(items.map((item) => item.id)));
    }
  }, [items, selectedItems]);

  const formatFileSize = (bytes: number | null | undefined): string => {
    if (!bytes) return '-';
    const kb = bytes / 1024;
    const mb = kb / 1024;
    const gb = mb / 1024;
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    if (kb >= 1) return `${kb.toFixed(1)} KB`;
    return `${bytes} B`;
  };

  const handleNavigateToFolder = (folderId: string, folderName: string) => {
    setParentId(folderId);
    setSearchQuery('');
  };

  const handleNavigateUp = () => {
    setParentId(undefined);
    setSearchQuery('');
  };

  const handleDownload = async (item: Item) => {
    try {
      await downloadFile(item.id);
    } catch (err) {
      console.error('Failed to download:', err);
      alert('Failed to download file');
    }
  };

  const handleDeleteClick = (item: Item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      deleteItemMutation.mutate(itemToDelete.id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Documents</h1>
            </div>
            <div className="flex items-center space-x-3">
              {selectedItems.size > 0 && (
                <button
                  onClick={() => setShowBulkDeleteModal(true)}
                  className="bg-red-100 text-red-700 px-4 py-2 rounded-md hover:bg-red-200 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete ({selectedItems.size})</span>
                </button>
              )}
              <button
                onClick={() => setShowFolderModal(true)}
                className="btn-secondary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add new folder</span>
              </button>
              <button
                onClick={() => setShowDocModal(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload files</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Breadcrumbs */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {parentId ? (
                <button
                  onClick={handleNavigateUp}
                  className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  <Folder className="w-4 h-4" />
                  <span>Back to parent</span>
                </button>
              ) : (
                <span className="text-sm text-gray-500">Home</span>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10 w-64"
              />
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">Failed to load documents. Please try again.</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        )}

        {/* Documents Table */}
        {!isLoading && !error && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="relative px-6 py-3">
                    <input
                      type="checkbox"
                      checked={items && selectedItems.size === items.length}
                      onChange={handleSelectAll}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th scope="col" className="table-header">
                    Name
                  </th>
                  <th scope="col" className="table-header">
                    Created By
                  </th>
                  <th scope="col" className="table-header">
                    Created At
                  </th>
                  <th scope="col" className="table-header">
                    Size
                  </th>
                  <th scope="col" className="table-header">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items?.map((item) => (
                  <tr
                    key={item.id}
                    className={clsx(
                      'hover:bg-gray-50 transition-colors duration-150',
                      selectedItems.has(item.id) && 'bg-primary-50'
                    )}
                  >
                    <td className="relative px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectItem(item.id);
                        }}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className={clsx(
                            'flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg',
                            item.type === 'FOLDER'
                              ? 'bg-yellow-100 text-yellow-600'
                              : 'bg-blue-100 text-blue-600'
                          )}
                        >
                          {item.type === 'FOLDER' ? (
                            <Folder className="h-5 w-5" />
                          ) : (
                            <File className="h-5 w-5" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {item.type === 'FOLDER' ? (
                              <button
                                onClick={() => handleNavigateToFolder(item.id, item.name)}
                                className="hover:text-primary-600 hover:underline"
                              >
                                {item.name}
                              </button>
                            ) : (
                              item.name
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.type === 'FOLDER' ? 'Folder' : item.extension?.toUpperCase() || 'File'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">{item.createdBy}</td>
                    <td className="table-cell">
                      {format(new Date(item.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="table-cell">
                      {formatFileSize(item.fileSizeBytes || undefined)}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-3">
                        {item.type === 'DOCUMENT' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(item);
                            }}
                            className="text-primary-600 hover:text-primary-900 flex items-center space-x-1"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(item);
                          }}
                          className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {items?.length === 0 && (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new folder or uploading a file.
                </p>
              </div>
            )}

            {/* Pagination */}
            {items && items.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {items.length} items
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-500">
                    Page {page}
                  </span>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={items.length < pageSize}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Folder Modal */}
      {showFolderModal && (
        <CreateFolderModal
          onClose={() => setShowFolderModal(false)}
          onSubmit={(data) =>
            createFolderMutation.mutate({
              ...data,
              createdBy: 'Current User',
            })
          }
          isLoading={createFolderMutation.isPending}
        />
      )}

      {/* Document Upload Modal */}
      {showDocModal && (
        <UploadFileModal
          parentId={parentId}
          onClose={() => {
            setShowDocModal(false);
            setUploadError(null);
          }}
          onSubmit={(data) =>
            uploadFileMutation.mutate({
              ...data,
              parentId,
              createdBy: 'Current User',
            })
          }
          isLoading={uploadFileMutation.isPending}
          error={uploadError}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteConfirmModal
          item={itemToDelete}
          onClose={() => {
            setShowDeleteModal(false);
            setItemToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          isLoading={deleteItemMutation.isPending}
        />
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <BulkDeleteModal
          count={selectedItems.size}
          onClose={() => setShowBulkDeleteModal(false)}
          onConfirm={() => deleteItemsMutation.mutate(Array.from(selectedItems))}
          isLoading={deleteItemsMutation.isPending}
        />
      )}
    </div>
  );
}

function CreateFolderModal({
  onClose,
  onSubmit,
  isLoading,
}: {
  onClose: () => void;
  onSubmit: (data: { name: string }) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Folder name is required');
      return;
    }
    onSubmit({ name });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Create New Folder</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Folder Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              className="input-field"
              placeholder="Enter folder name"
              autoFocus
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? (
                <span className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </span>
              ) : (
                'Create Folder'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UploadFileModal({
  parentId,
  onClose,
  onSubmit,
  isLoading,
  error,
}: {
  parentId: string | undefined;
  onClose: () => void;
  onSubmit: (data: { file: File; name?: string; parentId?: string }) => void;
  isLoading: boolean;
  error: string | null;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customName, setCustomName] = useState('');
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileError('');
      if (!customName) {
        setCustomName(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setFileError('Please select a file to upload');
      return;
    }
    onSubmit({
      file: selectedFile,
      name: customName || undefined,
      parentId,
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileError('');
      if (!customName) {
        setCustomName(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const formatFileSize = (bytes: number): string => {
    const kb = bytes / 1024;
    const mb = kb / 1024;
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    if (kb >= 1) return `${kb.toFixed(1)} KB`;
    return `${bytes} B`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Upload File</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          {/* Drag and drop zone */}
          <div
            className={clsx(
              'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-200',
              selectedFile
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-primary-400'
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept="*/*"
            />
            {selectedFile ? (
              <div className="flex items-center justify-center space-x-3">
                <File className="w-8 h-8 text-primary-600" />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
            ) : (
              <div>
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Drag and drop a file here, or click to select
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Maximum file size: 50MB
                </p>
              </div>
            )}
          </div>
          {fileError && <p className="mt-1 text-sm text-red-600">{fileError}</p>}

          {/* Custom name input */}
          <div className="mt-4">
            <label htmlFor="customName" className="block text-sm font-medium text-gray-700 mb-1">
              File Name (optional)
            </label>
            <input
              type="text"
              id="customName"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="input-field"
              placeholder="Leave empty to use original filename"
            />
          </div>

          {/* API Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedFile}
              className="btn-primary"
            >
              {isLoading ? (
                <span className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading...</span>
                </span>
              ) : (
                'Upload'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete Confirmation Modal
function DeleteConfirmModal({
  item,
  onClose,
  onConfirm,
  isLoading,
}: {
  item: Item | null;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Delete {item.type === 'FOLDER' ? 'Folder' : 'Document'}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-red-100">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-gray-700">
              Are you sure you want to delete <strong>{item.name}</strong>?
            </p>
          </div>
          {item.type === 'FOLDER' && (
            <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded">
              Warning: This will also delete all files and subfolders inside this folder.
            </p>
          )}
          <p className="text-sm text-gray-500 mt-4">
            This action cannot be undone.
          </p>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button onClick={onClose} className="btn-secondary" disabled={isLoading}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Bulk Delete Confirmation Modal
function BulkDeleteModal({
  count,
  onClose,
  onConfirm,
  isLoading,
}: {
  count: number;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Delete {count} Items</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-red-100">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-gray-700">
              Are you sure you want to delete <strong>{count} items</strong>?
            </p>
          </div>
          <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded mb-4">
            Warning: Folders will be deleted along with all their contents.
          </p>
          <p className="text-sm text-gray-500">
            This action cannot be undone.
          </p>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button onClick={onClose} className="btn-secondary" disabled={isLoading}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete All</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
