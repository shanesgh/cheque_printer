import { SavedDocument } from '../types/claims';

const STORAGE_KEY = 'claims_documents';

export function saveDocument(fileName: string, data: ArrayBuffer): string {
  const documents = getStoredDocuments();
  const id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const newDocument: SavedDocument = {
    id,
    fileName,
    uploadDate: new Date().toISOString(),
    data,
  };
  
  // Convert ArrayBuffer to base64 for storage
  const base64Data = arrayBufferToBase64(data);
  const storageDocument = {
    ...newDocument,
    data: base64Data,
  };
  
  documents.push(storageDocument);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
  
  return id;
}

export function getStoredDocuments(): any[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function downloadDocument(id: string): void {
  const documents = getStoredDocuments();
  const document = documents.find(doc => doc.id === id);
  
  if (!document) {
    throw new Error('Document not found');
  }
  
  // Convert base64 back to ArrayBuffer
  const arrayBuffer = base64ToArrayBuffer(document.data);
  const blob = new Blob([arrayBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = document.fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function deleteAllDocuments(): void {
  localStorage.removeItem(STORAGE_KEY);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}