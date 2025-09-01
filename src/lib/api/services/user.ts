import type { AxiosResponse } from "axios";
import api from "../client";
import type { User, UpdateProfileData, ChangePasswordData } from "../types";

// User API
export const userApi = {
  getProfile: (): Promise<AxiosResponse<User>> => api.get("/users/me"),

  updateProfile: (data: UpdateProfileData): Promise<AxiosResponse<User>> =>
    api.put("/users/me", data),

  changePassword: (
    data: ChangePasswordData,
  ): Promise<AxiosResponse<{ message: string }>> =>
    api.put("/users/me/password", data),

  uploadAvatar: (file: File): Promise<AxiosResponse<{ avatar: string }>> => {
    const formData = new FormData();
    formData.append("avatar", file);
    return api.put("/users/me/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  removeAvatar: (): Promise<AxiosResponse<{ message: string }>> =>
    api.delete("/users/me/avatar"),
};
