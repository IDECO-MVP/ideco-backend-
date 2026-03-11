export const ApiResponse = {
    success: <T>(message: string, data: T) => {
        return {
            success: true,
            message,
            data: Array.isArray(data) ? data : (data || {}),
        };
    },
    error: (message: string, data: any = null) => {
        return {
            success: false,
            message,
            data: data || {},
        };
    },
    successWithPagination: <T>(message: string, data: T, metadata: any) => {
        return {
            success: true,
            message,
            data: Array.isArray(data) ? data : (data || {}),
            metadata,
        };
    },
};
