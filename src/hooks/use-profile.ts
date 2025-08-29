import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import {
  type ChangePasswordData,
  type UpdateProfileData,
  type User,
  userApi,
} from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export const useProfile = () => {
  return useQuery<User, AxiosError>({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await userApi.getProfile();
      return response.data;
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation<User, AxiosError, UpdateProfileData>({
    mutationFn: async (data) => {
      const response = await userApi.updateProfile(data);
      return response.data;
    },
    onSuccess: (updatedUser) => {
      // Update the profile query cache
      queryClient.setQueryData(["profile"], updatedUser);

      // Update the auth store with the new user data
      setUser(updatedUser);

      // Also update localStorage
      localStorage.setItem("user", JSON.stringify(updatedUser));

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};

export const useChangePassword = () => {
  return useMutation<{ message: string }, AxiosError, ChangePasswordData>({
    mutationFn: async (data) => {
      const response = await userApi.changePassword(data);
      return response.data;
    },
  });
};
