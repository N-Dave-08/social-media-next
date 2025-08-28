"use client";

import { useEffect } from "react";
import { AuthForm } from "@/components/forms/auth-form";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/hooks/use-auth";
import { useAuthStore } from "@/stores/auth-store";

export default function Home() {
  const { user, isLoading, isAuthenticated, initializeAuth } = useAuthStore();
  const logoutMutation = useLogout();

  useEffect(() => {
    // Initialize auth state from localStorage
    initializeAuth();
  }, [initializeAuth]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Social Media App
          </h1>
          <p className="text-gray-600">Connect and share with the world</p>
        </header>

        {!isAuthenticated || !user ? (
          <div className="flex justify-center">
            <AuthForm />
          </div>
        ) : (
          <div className="text-center">
            <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                {user.name.charAt(0).toUpperCase()}
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome, {user.name}!
              </h2>

              <div className="text-gray-600 space-y-1 mb-6">
                <p>
                  <strong>Username:</strong> @{user.username}
                </p>
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
                <p>
                  <strong>Role:</strong>{" "}
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === "ADMIN"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {user.role}
                  </span>
                </p>
                <p>
                  <strong>Member since:</strong>{" "}
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>

              <Button
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </Button>
            </div>

            <div className="mt-8 text-gray-500">
              <p>🎉 Authentication is working with Zustand!</p>
              {user.role === "ADMIN" && (
                <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-purple-800 font-medium">
                    🔑 Admin Features:
                  </p>
                  <div className="mt-2 space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open("/api/admin/users", "_blank")}
                    >
                      View All Users (API)
                    </Button>
                  </div>
                </div>
              )}
              <p className="text-sm mt-2">
                Posts and other features coming next...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
