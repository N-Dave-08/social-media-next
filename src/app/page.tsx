"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/forms/auth-form";
import { useAuthStore } from "@/stores/auth-store";

export default function Home() {
  const { user, isLoading, isAuthenticated, initializeAuth } = useAuthStore();
  const router = useRouter();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Initialize auth state from localStorage only once
    if (!hasInitialized.current) {
      initializeAuth();
      hasInitialized.current = true;
    }
  }, [initializeAuth]);

  useEffect(() => {
    // Redirect based on user role after authentication
    if (!isLoading && isAuthenticated && user) {
      if (user.role === "ADMIN") {
        router.push("/dashboard");
      } else if (user.role === "USER") {
        router.push("/feed");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  // Show auth form if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <header className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Social Media App
            </h1>
            <p className="text-gray-600">Connect and share with the world</p>
          </header>

          <div className="flex justify-center">
            <AuthForm />
          </div>
        </div>
      </div>
    );
  }

  // Show loading while redirecting authenticated users
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-lg text-gray-600">Redirecting...</div>
    </div>
  );
}
