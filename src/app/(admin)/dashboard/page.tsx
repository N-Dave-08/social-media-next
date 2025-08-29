"use client";

import { BarChart3, Settings, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SettingsManagement } from "@/app/(admin)/dashboard/components/settings-management";
import { UserManagement } from "@/app/(admin)/dashboard/components/user-management";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLogout } from "@/hooks/use-auth";
import { useAuthStore } from "@/stores/auth-store";

export default function DashboardPage() {
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
    // Redirect regular users to feed
    else if (!isLoading && isAuthenticated && user?.role === "USER") {
      router.push("/feed");
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

  if (user.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
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

      <main className="max-w-6xl mx-auto py-8 px-4">
        <div className="grid gap-6">
          {/* Welcome Section */}
          <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to the Admin Dashboard, {user.name}!
            </h2>
            <p className="text-gray-600 mb-6">
              This is the admin dashboard. You have full access to manage the
              platform.
            </p>
            <div className="text-sm text-gray-500">
              <p>
                Role:{" "}
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                  {user.role}
                </span>
              </p>
              <p className="mt-2">
                Member since: {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Admin Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <Tabs defaultValue="users">
              <TabsList className="w-[calc(100%-2rem)] mx-4 mt-4">
                <TabsTrigger value="users">
                  <Users className="w-4 h-4" />
                  <span>Users</span>
                </TabsTrigger>
                <TabsTrigger value="analytics">
                  <BarChart3 className="w-4 h-4" />
                  <span>Analytics</span>
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </TabsTrigger>
              </TabsList>

              <div className="p-6">
                <TabsContent value="users">
                  <UserManagement />
                </TabsContent>

                <TabsContent value="analytics">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-6 h-6 text-gray-700" />
                      <h2 className="text-2xl font-bold text-gray-900">
                        Analytics
                      </h2>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <p className="text-gray-600 mb-4">
                        Analytics dashboard is coming soon!
                      </p>
                      <p className="text-sm text-gray-500">
                        This will include user engagement metrics, content
                        performance, and platform statistics.
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="settings">
                  <SettingsManagement />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
