export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  statusCode: number;
  meta?: unknown;
}

export function apiResponse<T>(
  data: T,
  message = "Success",
  statusCode = 200,
  meta?: unknown,
): ApiResponse<T> {
  const res: ApiResponse<T> = {
    success: statusCode >= 200 && statusCode < 300,
    data,
    message,
    statusCode,
  };
  if (meta !== undefined) {
    res.meta = meta;
  }
  return res;
}
