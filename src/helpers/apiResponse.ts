export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  statusCode: number;
}

export function apiResponse<T>(
  data: T,
  message = "Success",
  statusCode = 200,
): ApiResponse<T> {
  return {
    success: statusCode >= 200 && statusCode < 300,
    data,
    message,
    statusCode,
  };
}
