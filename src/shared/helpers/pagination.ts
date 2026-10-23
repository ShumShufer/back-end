import {
  PAGINATION_DEFAULT_PAGE,
  PAGINATION_DEFAULT_PAGE_SIZE,
  PAGINATION_MAX_PAGE_SIZE,
} from "../config/constants.js";

export interface PaginationParams {
  page?: number | string;
  limit?: number | string;
  pageSize?: number | string;
}

export interface PaginationResult {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Calculates Prisma-ready skip/take options and sanitized page/limit numbers.
 */
export function getPagination(params: PaginationParams = {}): PaginationResult {
  const rawPage = Number(params.page);
  const page = !isNaN(rawPage) && rawPage > 0 ? Math.floor(rawPage) : PAGINATION_DEFAULT_PAGE;

  const rawLimit = Number(params.pageSize ?? params.limit);
  let limit =
    !isNaN(rawLimit) && rawLimit > 0
      ? Math.floor(rawLimit)
      : PAGINATION_DEFAULT_PAGE_SIZE;

  if (limit > PAGINATION_MAX_PAGE_SIZE) {
    limit = PAGINATION_MAX_PAGE_SIZE;
  }

  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
    take: limit,
  };
}

/**
 * Builds a standardized pagination metadata object.
 */
export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  return {
    page,
    pageSize: limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

/**
 * Convenience helper to wrap data array and total count into a paginated result.
 */
export function paginate<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return {
    data,
    meta: buildPaginationMeta(total, page, limit),
  };
}
