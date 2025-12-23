/**
 * Định dạng chuỗi ngày tháng sang "DD/MM/YYYY" một cách an toàn.
 * Sử dụng getUTC... để tránh lỗi Hydration do múi giờ.
 */
export const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'N/A';
    try {
        const date = new Date(dateStr);
        const d = date.getUTCDate().toString().padStart(2, '0');
        const m = (date.getUTCMonth() + 1).toString().padStart(2, '0');
        const y = date.getUTCFullYear();
        return `${d}/${m}/${y}`;
    } catch {
        return 'Invalid Date';
    }
};

/**
 * Trích xuất tên file gốc từ URL lưu trên MinIO/S3.
 */
export const getFileNameFromUrl = (url?: string): string => {
    if (!url) return "";
    try {
        const parts = url.split('/');
        const fullName = parts[parts.length - 1];
        // Tên file có dạng timestamp-originalname.ext
        const nameParts = fullName.split('-');
        if (nameParts.length > 1) {
            return nameParts.slice(1).join('-');
        }
        return fullName;
    } catch {
        return "File";
    }
};

/**
 * Định dạng số sang tiền tệ VNĐ.
 */
export const formatCurrency = (amount?: number): string => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

/**
 * Định dạng khoảng lương.
 */
export const formatSalaryRange = (min?: number, max?: number): string => {
    if (!min && !max) return 'Thỏa thuận';
    if (!min) return `Lên đến ${formatCurrency(max)}`;
    if (!max) return `Từ ${formatCurrency(min)}`;
    return `${formatCurrency(min)} - ${formatCurrency(max)}`;
};
