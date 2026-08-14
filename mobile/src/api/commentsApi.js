/**
 * Comment thread API calls.
 * Mirrors: the comment endpoints in client/src/features/posts/postsApiSlice.js
 *
 * Thin wrappers over apiClient so screens never assemble URLs or unwrap
 * `response.data` themselves. Nothing here catches - callers decide what a
 * failure means for their own UI.
 *
 * The list is already merged and sorted server-side: the site's own comments
 * interleaved by time with the ones left on the auto-posted Facebook and
 * Instagram copies, each entry carrying its own `source`. Nothing on this
 * side re-sorts or re-groups them.
 */

import apiClient from './apiService';
import { API_ENDPOINTS } from '../config/api';

const { POSTS } = API_ENDPOINTS;

export const fetchComments = async (postId, { page = 1, pageSize = 20 } = {}) => {
  const response = await apiClient.get(POSTS.COMMENTS(postId), { params: { page, pageSize } });
  return response.data;
};

export const addComment = async (postId, text) => {
  const response = await apiClient.post(POSTS.COMMENTS(postId), { text });
  return response.data;
};

export const deleteComment = async (postId, commentId) => {
  const response = await apiClient.delete(POSTS.COMMENT(postId, commentId));
  return response.data;
};

export const reportComment = async (postId, commentId, { reasonType = 'inappropriate_content', reason = '' } = {}) => {
  const response = await apiClient.post(POSTS.REPORT_COMMENT(postId, commentId), { reasonType, reason });
  return response.data;
};
