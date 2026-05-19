import { apiClient } from './client';
import type { ApiResponse } from './types';

export type CommentResourceType = 'notice' | 'gallery_post';
export type CommentStatus = 'pending' | 'approved' | 'rejected';

export interface CommentItem {
  id:           string;
  resourceType: CommentResourceType;
  resourceId:   string;
  userId:       string;
  content:      string;
  status:       CommentStatus;
  createdAt:    string;
  reviewedAt?:  string | null;
  rejectReason?: string | null;
  author?: {
    id:        string;
    fullName:  string;
    role:      'admin' | 'coach' | 'parent';
    avatarUrl?: string | null;
  } | null;
}

export interface CreateCommentBody {
  resourceType: CommentResourceType;
  resourceId:   string;
  content:      string;
}

export async function listPublicComments(params: {
  resourceType: CommentResourceType;
  resourceId:   string;
  page?:  number;
  limit?: number;
}) {
  const { data } = await apiClient.get<ApiResponse<CommentItem[]>>('/comments/public', { params });
  return data;
}

export async function listMyCommentsForResource(params: {
  resourceType: CommentResourceType;
  resourceId:   string;
  page?:  number;
  limit?: number;
}) {
  const { data } = await apiClient.get<ApiResponse<CommentItem[]>>('/comments/mine', { params });
  return data;
}

export async function createComment(body: CreateCommentBody) {
  const { data } = await apiClient.post<ApiResponse<CommentItem>>('/comments', body);
  return data;
}

export async function listAdminComments(params?: {
  status?: 'pending' | 'approved' | 'rejected' | 'all';
  resourceType?: CommentResourceType;
  page?:  number;
  limit?: number;
}) {
  const { data } = await apiClient.get<ApiResponse<CommentItem[]>>('/comments/admin', { params });
  return data;
}

export async function approveComment(id: string) {
  const { data } = await apiClient.post<ApiResponse<CommentItem>>(`/comments/${id}/approve`);
  return data;
}

export async function rejectComment(id: string, reason?: string) {
  const { data } = await apiClient.post<ApiResponse<CommentItem>>(`/comments/${id}/reject`, { reason });
  return data;
}

export async function deleteComment(id: string) {
  const { data } = await apiClient.delete<ApiResponse<null>>(`/comments/${id}`);
  return data;
}

export async function pendingCommentsCount() {
  const { data } = await apiClient.get<ApiResponse<{ count: number }>>('/comments/admin/pending-count');
  return data;
}
