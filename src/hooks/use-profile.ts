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

      // Invalidate posts to update author information
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};

export const useChangePassword = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, AxiosError, ChangePasswordData>({
    mutationFn: async (data) => {
      const response = await userApi.changePassword(data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate profile query to refresh user data
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation<{ avatar: string }, AxiosError, File>({
    mutationFn: async (file) => {
      const response = await userApi.uploadAvatar(file);
      return response.data;
    },
    onSuccess: (data) => {
      // Update the profile query cache with new avatar
      queryClient.setQueryData(["profile"], (old: User | undefined) => ({
        ...old,
        avatar: data.avatar,
      }));

      // Update the auth store with the new user data
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        const updatedUser = { ...currentUser, avatar: data.avatar };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["profile"] });

      // Invalidate posts to update author avatars
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};

export const useRemoveAvatar = () => {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation<{ message: string }, AxiosError>({
    mutationFn: async () => {
      const response = await userApi.removeAvatar();
      return response.data;
    },
    onSuccess: () => {
      // Update the profile query cache to remove avatar
      queryClient.setQueryData(["profile"], (old: User | undefined) => ({
        ...old,
        avatar: undefined,
      }));

      // Update the auth store with the new user data
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        const updatedUser = { ...currentUser, avatar: undefined };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["profile"] });

      // Invalidate posts to update author avatars
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};
