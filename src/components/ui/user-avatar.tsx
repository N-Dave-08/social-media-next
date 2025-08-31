"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user: {
    name: string;
    avatar?: string;
  };
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function UserAvatar({ user, size = "md", className }: UserAvatarProps) {
  const getAvatarSrc = () => {
    if (user?.avatar && user.avatar.trim() !== "") {
      // Add cache busting if not already present
      if (user.avatar.includes("?v=")) {
        return user.avatar;
      }
      return `${user.avatar}&v=${Date.now()}`;
    }
    return undefined;
  };

  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
    xl: "w-24 h-24 text-2xl",
  };

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src={getAvatarSrc()} alt={`${user.name}'s avatar`} />
      <AvatarFallback className="bg-blue-100 text-blue-600">
        {user.name?.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
