"use client";

import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useLikePost } from "@/hooks/use-posts";
import type { Post } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { CommentsSection } from "./comments-section";

interface PostItemProps {
  post: Post;
}

export function PostItem({ post }: PostItemProps) {
  const { user } = useAuthStore();
  const likeMutation = useLikePost();

  const isLikedByMe =
    !!user &&
    Array.isArray(post.likes) &&
    post.likes.some((l) => l.userId === user.id);

  const onLike = () => {
    likeMutation.mutate(post.id);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <UserAvatar user={post.author} size="lg" />
          <div>
            <div className="font-semibold text-gray-900">
              {post.author.name}
            </div>
            <div className="text-sm text-gray-500">@{post.author.username}</div>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          {new Date(post.createdAt).toLocaleString()}
        </div>
      </div>

      <div className="mt-3 text-gray-800 whitespace-pre-wrap">
        {post.content}
      </div>

      <div className="mt-4 flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "flex items-center space-x-2",
            isLikedByMe && "text-red-600",
          )}
          onClick={onLike}
          disabled={likeMutation.isPending}
        >
          <Heart
            className={cn(
              "w-4 h-4",
              isLikedByMe ? "fill-red-600 text-red-600" : "text-gray-600",
            )}
          />
          <span className="text-sm">{post._count.likes}</span>
        </Button>
      </div>

      {/* Comments Section */}
      <CommentsSection post={post} />
    </div>
  );
}
