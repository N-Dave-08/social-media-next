import type { AxiosResponse } from "axios";
import api from "../client";
import type {
  AuthResponse,
  RefreshResponse,
  LoginData,
  SignupData,
} from "../types";

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
