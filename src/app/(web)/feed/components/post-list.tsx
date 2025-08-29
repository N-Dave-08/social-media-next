"use client";

import { usePosts } from "@/hooks/use-posts";
import { usePostsStore } from "@/stores/posts-store";
import { PostItem } from "./post-item";

export function PostList() {
  // Trigger fetch; state is synced into the store inside the hook
  usePosts();

  const { posts, isLoading, error } = usePostsStore();

  if (isLoading) {
    return <div className="text-center text-gray-600">Loading posts...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600">{error}</div>;
  }

  if (!posts.length) {
    return <div className="text-center text-gray-500">No posts yet.</div>;
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostItem key={post.id} post={post} />
      ))}
    </div>
  );
}
