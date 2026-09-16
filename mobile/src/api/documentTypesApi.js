/**
 * Document-title API calls.
 * Mirrors: client/src/features/dependencies/documentTypesApiSlice.js
 *
 * A listing filed under DOCUMENTS carries no photo - publishing a picture of
 * someone's identity papers hands their name, number and address to every
 * reader - so it names the document instead, from this vocabulary. A title the
 * list does not carry is added by the author, in Arabic and in Latin letters,
 * and is then there for whoever files the same paper next.
 *
 * Thin wrappers over apiClient; nothing here catches, callers decide what a
 * failure means for their own UI.
 */

import apiClient from './apiService';
import { API_ENDPOINTS } from '../config/api';

const { DOCUMENT_TYPES } = API_ENDPOINTS;

export const fetchDocumentTypes = async () => {
  const response = await apiClient.get(DOCUMENT_TYPES.LIST);
  const data = response.data?.data || response.data || [];
  return data.map((documentType) => ({
    ...documentType,
    _id: documentType._id || documentType.id,
  }));
};

// The server answers 200 with the existing row when the title is already saved
// under another spelling and 201 when it really created one; both carry the
// row, so callers treat them the same.
export const createDocumentType = async ({ arabicLabel, latinLabel }) => {
  const response = await apiClient.post(DOCUMENT_TYPES.CREATE, { arabicLabel, latinLabel });
  const documentType = response.data?.documentType || null;
  return documentType ? { ...documentType, _id: documentType._id || documentType.id } : null;
};
