export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  errors?: { field?: string; message: string }[];
}

export interface ApiError extends Error {
  status?: number;
  payload?: ApiResponse;
}
