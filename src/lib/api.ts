import axios, { type AxiosResponse } from "axios";

// Create axios instance
const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Include cookies in requests
});

// Token refresh flag to prevent multiple refresh attempts
let isRefreshing = false;
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
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token
        const response = await api.post("/auth/refresh");
        const { accessToken } = response.data;

        // Store new access token
        localStorage.setItem("accessToken", accessToken);

        // Process queued requests
        processQueue(null, accessToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear auth state and redirect to login
        processQueue(refreshError as Error, null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");

        // Only redirect if we're not already on auth pages
        if (!window.location.pathname.includes("/auth")) {
          window.location.href = "/";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// Types
export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  role: string;
  createdAt: string;
}

export interface Post {
  id: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    name: string;
    avatar?: string;
  };
  _count: {
    likes: number;
    comments: number;
  };
  likes: Array<{ userId: string }>;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  username: string;
  name: string;
  password: string;
}

export interface CreatePostData {
  content: string;
  imageUrl?: string;
}

// Auth API
export const authApi = {
  login: (data: LoginData): Promise<AxiosResponse<AuthResponse>> =>
    api.post("/auth/login", data),

  signup: (data: SignupData): Promise<AxiosResponse<AuthResponse>> =>
    api.post("/auth/signup", data),

  refresh: (): Promise<AxiosResponse<RefreshResponse>> =>
    api.post("/auth/refresh"),

  logout: (): Promise<AxiosResponse<{ message: string }>> =>
    api.post("/auth/logout"),

  logoutAll: (): Promise<AxiosResponse<{ message: string }>> =>
    api.post("/auth/logout-all"),
};

// Posts API
export const postsApi = {
  getPosts: (): Promise<AxiosResponse<Post[]>> => api.get("/posts"),

  createPost: (data: CreatePostData): Promise<AxiosResponse<Post>> =>
    api.post("/posts", data),

  likePost: (postId: string): Promise<AxiosResponse<{ liked: boolean }>> =>
    api.post(`/posts/${postId}/like`),
};

// Admin API
export const adminApi = {
  getUsers: (): Promise<AxiosResponse<User[]>> => api.get("/admin/users"),

  updateUserRole: (
    userId: string,
    role: string,
  ): Promise<AxiosResponse<User>> =>
    api.patch(`/admin/users/${userId}/role`, { role }),
};

// Test API
export const testApi = {
  testConnection: (): Promise<AxiosResponse<{ message: string }>> =>
    api.get("/test"),

  testDatabase: (): Promise<
    AxiosResponse<{ message: string; userCount: number; databaseUrl: string }>
  > => api.get("/test-db"),
};

export default api;
