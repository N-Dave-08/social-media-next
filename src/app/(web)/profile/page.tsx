"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/hooks/use-auth";
import { useAuthStore } from "@/stores/auth-store";
import { ProfileManagement } from "./components/profile-management";

export default function ProfilePage() {
  const { user, isLoading, isAuthenticated, initializeAuth } = useAuthStore();
  const logoutMutation = useLogout();
  const router = useRouter();

  useEffect(() => {
    // Initialize auth state from localStorage
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    // Redirect to home if not authenticated
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
    // Redirect admins to dashboard
    else if (!isLoading && isAuthenticated && user?.role === "ADMIN") {
      router.push("/dashboard");
    }
  }, [isLoading, isAuthenticated, user, router]);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Redirecting to login...</div>
      </div>
    );
  }

  if (user.role !== "USER") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/feed")}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back to Feed
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-gray-700">@{user.username}</span>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4">
        <ProfileManagement />
      </main>
    </div>
  );
}
