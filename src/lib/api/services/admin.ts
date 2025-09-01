import type { AxiosResponse } from "axios";
import api from "../client";
import type { User, UsersResponse, GetUsersParams } from "../types";

// Admin API
export const adminApi = {
  getUsers: (
    params?: GetUsersParams,
  ): Promise<AxiosResponse<UsersResponse>> => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append("search", params.search);
    if (params?.role) searchParams.append("role", params.role);
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());

    const queryString = searchParams.toString();
    return api.get(`/admin/users${queryString ? `?${queryString}` : ""}`);
  },

  updateUserRole: (
    userId: string,
    role: string,
  ): Promise<AxiosResponse<User>> =>
    api.patch(`/admin/users/${userId}/role`, { role }),
};
