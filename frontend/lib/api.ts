const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

interface RequestOptions extends RequestInit {
    headers?: Record<string, string>;
}

// Helper to get or create a persistent guestId
function getGuestId() {
    if (typeof window === 'undefined') return null;
    let gid = localStorage.getItem('guestId');
    if (!gid) {
        gid = crypto.randomUUID();
        localStorage.setItem('guestId', gid);
    }
    return gid;
}

async function fetchClient<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${API_URL}${endpoint}`;

    const headers: Record<string, string> = {
        ...options.headers,
    };

    // Add Guest ID to every request
    const gid = getGuestId();
    if (gid) {
        headers['X-Guest-Id'] = gid;
    }

    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

    if (!headers['Content-Type'] && !isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'API request failed');
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    } else {
        return response.text() as unknown as T;
    }
}

export const api = {
    get: <T = any>(endpoint: string) => fetchClient<T>(endpoint, { method: 'GET' }),
    post: <T = any>(endpoint: string, body: any) => {
        const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
        return fetchClient<T>(endpoint, {
            method: 'POST',
            body: isFormData ? body : JSON.stringify(body)
        });
    },
    put: <T = any>(endpoint: string, body: any) => {
        const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
        return fetchClient<T>(endpoint, {
            method: 'PUT',
            body: isFormData ? body : JSON.stringify(body)
        });
    },
    patch: <T = any>(endpoint: string, body: any) => {
        const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
        return fetchClient<T>(endpoint, {
            method: 'PATCH',
            body: isFormData ? body : JSON.stringify(body)
        });
    },
    delete: <T = any>(endpoint: string) => fetchClient<T>(endpoint, { method: 'DELETE' }),
};