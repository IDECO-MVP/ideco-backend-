export interface PaginationOptions {
    page?: number;
    limit?: number;
}

export interface PaginationResult {
    offset: number;
    limit: number;
}

export interface PaginationMetadata {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
}

/**
 * Get offset and limit for Sequelize query based on page and limit
 */
export const getPagination = (page?: any, limit?: any): PaginationResult => {
    const p = page ? parseInt(String(page)) : 1;
    const l = limit ? parseInt(String(limit)) : 10;

    const offset = (p - 1) * l;
    return { offset, limit: l };
};

/**
 * Format pagination metadata for the response
 */
export const getPagingData = (count: number, page: any, limit: any): PaginationMetadata => {
    const currentPage = page ? parseInt(String(page)) : 1;
    const l = limit ? parseInt(String(limit)) : 10;
    const totalPages = Math.ceil(count / l);

    return { totalItems: count, totalPages, currentPage, limit: l };
};
