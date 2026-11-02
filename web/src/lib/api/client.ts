import axios from 'axios';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

/**
 * Axios client kết nối backend API
 * - Tự động gắn Bearer token từ localStorage (khóa trello.token)
 * - Interceptor 401: Xóa token và chuyển hướng về /login kèm thông báo hết hạn phiên (BR-05, RISK-01)
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('trello.token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      localStorage.removeItem('trello.token');

      // Không redirect nếu đang ở trang login hoặc register
      const pathname = window.location.pathname;
      if (!pathname.startsWith('/login') && !pathname.startsWith('/register')) {
        const redirectParam = encodeURIComponent(pathname + window.location.search);
        window.location.href = `/login?redirect=${redirectParam}&expired=true`;
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
