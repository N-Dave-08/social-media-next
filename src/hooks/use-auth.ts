import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import {
  type AuthResponse,
  authApi,
  type LoginData,
  type SignupData,
} from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export const useLogin = () => {
  const queryClient = useQueryClient();
  const { login: setAuthState } = useAuthStore();

  return useMutation<AuthResponse, AxiosError, LoginData>({
    mutationFn: async (data) => {
      const response = await authApi.login(data);
      return response.data;
    },
    onSuccess: (data) => {
      // Update Zustand store
      setAuthState(data.user, data.accessToken);

      // Also update localStorage for persistence
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Invalidate and refetch user-related queries
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
};

export const useSignup = () => {
  const queryClient = useQueryClient();
  const { login: setAuthState } = useAuthStore();

  return useMutation<AuthResponse, AxiosError, SignupData>({
    mutationFn: async (data) => {
      const response = await authApi.signup(data);
      return response.data;
    },
    onSuccess: (data) => {
      // Update Zustand store
      setAuthState(data.user, data.accessToken);

      // Also update localStorage for persistence
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Invalidate and refetch user-related queries
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const { logout: clearAuthState } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      // Call API logout to clear refresh token cookie
      try {
        await authApi.logout();
      } catch (_error) {
        // Continue with local logout even if API call fails
      }
      // Clear Zustand store (this also clears localStorage)
      clearAuthState();
    },
    onSuccess: () => {
      // Clear all queries
      queryClient.clear();
    },
  });
};
