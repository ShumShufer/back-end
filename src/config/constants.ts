/**
 * Pagination defaults and limits applied across all list endpoints.
 * Centralised here so changing them takes effect everywhere at once.
 */
export const PAGINATION_DEFAULT_PAGE = 1;
export const PAGINATION_DEFAULT_PAGE_SIZE = 20;
/** Hard cap on pageSize — prevents a single request from fetching unbounded rows */
export const PAGINATION_MAX_PAGE_SIZE = 100;
