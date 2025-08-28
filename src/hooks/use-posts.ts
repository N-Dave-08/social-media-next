import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { type CreatePostData, type Post, postsApi } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { usePostsStore } from "@/stores/posts-store";

export const usePosts = () => {
  const { setPosts, setLoading, setError } = usePostsStore();

  return useQuery<Post[], AxiosError>({
    queryKey: ["posts"],
    queryFn: async () => {
      setLoading(true);
      try {
        const response = await postsApi.getPosts();
        setPosts(response.data);
        return response.data;
      } catch (error) {
        setError(
          error instanceof AxiosError ? error.message : "Failed to fetch posts",
        );
        throw error;
      } finally {
        setLoading(false);
      }
    },
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  const { addPost } = usePostsStore();

  return useMutation<Post, AxiosError, CreatePostData>({
    mutationFn: async (data) => {
      const response = await postsApi.createPost(data);
      return response.data;
    },
    onSuccess: (newPost) => {
      // Add to Zustand store immediately
      addPost(newPost);

      // Invalidate and refetch posts to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};

export const useLikePost = () => {
  const queryClient = useQueryClient();
  const { optimisticLike } = usePostsStore();
  const { user } = useAuthStore();

  return useMutation<{ liked: boolean }, AxiosError, string>({
    mutationFn: async (postId) => {
      const response = await postsApi.likePost(postId);
      return response.data;
    },
    onMutate: async (postId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["posts"] });

      if (user) {
        // Get current state
        const posts = usePostsStore.getState().posts;
        const post = posts.find((p) => p.id === postId);

        if (post) {
          const isLiked = post.likes.some((like) => like.userId === user.id);
          // Optimistic update
          optimisticLike(postId, user.id, !isLiked);
        }
      }
    },
    onError: (_error, postId) => {
      // Revert optimistic update on error
      if (user) {
        const posts = usePostsStore.getState().posts;
        const post = posts.find((p) => p.id === postId);

        if (post) {
          const isLiked = post.likes.some((like) => like.userId === user.id);
          // Revert the optimistic update
          optimisticLike(postId, user.id, !isLiked);
        }
      }
    },
    onSettled: () => {
      // Refetch posts to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};
