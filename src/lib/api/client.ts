import axios from "axios";

// Create axios instance
const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Include cookies in requests
});

// Token refresh state management with race condition protection
// This prevents multiple concurrent refresh attempts by sharing a single refresh promise
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;
let failedQueue: Array<{
  resolve: (value?: string) => void;
  reject: (reason?: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token || undefined);
    }
  });

  failedQueue = [];
};

// Reset refresh state on successful refresh
const resetRefreshState = () => {
  isRefreshing = false;
  refreshPromise = null;
  failedQueue = [];
};

// Add auth token to requests
api.interceptors.request.use((config) => {
  // Get token from localStorage (access token only)
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for handling auth errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing && refreshPromise) {
        // If already refreshing, wait for the existing refresh promise
        try {
          const token = await refreshPromise;
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;

      // Create a single refresh promise that all concurrent requests will share
      refreshPromise = new Promise<string>((resolve, reject) => {
        // Try to refresh the token
        api
          .post("/auth/refresh")
          .then((response) => {
            const { accessToken } = response.data;

            // Store new access token
            localStorage.setItem("accessToken", accessToken);

            // Process queued requests
            processQueue(null, accessToken);

            resolve(accessToken);
          })
          .catch((refreshError) => {
            // Refresh failed - clear auth state and redirect to login
            processQueue(refreshError as Error, null);
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");

            // Only redirect if we're not already on auth pages and not already redirecting
            if (
              !window.location.pathname.includes("/auth") &&
              !window.location.pathname.includes("/login")
            ) {
              // Use a small delay to prevent rapid redirects
              setTimeout(() => {
                window.location.href = "/";
              }, 100);
            }

            reject(refreshError);
          })
          .finally(() => {
            resetRefreshState();
          });
      });

      try {
        const token = await refreshPromise;
        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
