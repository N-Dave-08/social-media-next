import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useAuthStore } from "@/stores/auth-store";
import { usePostsStore } from "@/stores/posts-store";
import {
  postsApi,
  type Post,
  type CreatePostData,
  type Comment,
} from "@/lib/api";

export const usePosts = () => {
  const { setPosts, setError } = usePostsStore();

  return useQuery<Post[], AxiosError>({
    queryKey: ["posts"],
    queryFn: async () => {
      try {
        const response = await postsApi.getPosts();
        setPosts(response.data);
        return response.data;
      } catch (error) {
        setError(
          error instanceof AxiosError ? error.message : "Failed to fetch posts",
        );
        throw error;
      }
    },
    // Keep showing cached list while fetching to avoid loading flashes
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { addPost, replacePost } = usePostsStore();

  return useMutation<Post, AxiosError, CreatePostData, { tempId: string }>({
    mutationFn: async (data) => {
      const response = await postsApi.createPost(data);
      return response.data;
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });

      // Create a temporary optimistic post
      const tempId = `temp-${Date.now()}`;
      const optimisticPost: Post = {
        id: tempId,
        content: data.content,
        imageUrl: data.imageUrl,
        createdAt: new Date().toISOString(),
        author: {
          id: user?.id || "",
          username: user?.username || "you",
          name: user?.name || "You",
          avatar: user?.avatar,
        },
        _count: { likes: 0, comments: 0 },
        likes: [],
      };

      addPost(optimisticPost);

      return { tempId };
    },
    onSuccess: (newPost, _vars, context) => {
      if (context?.tempId) {
        // Replace the temporary post with the actual one from the server
        replacePost(context.tempId, newPost);
      } else {
        addPost(newPost);
      }
      // Keep cache fresh
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: () => {
      // On error, simply refetch to reconcile state
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};

export const useLikePost = () => {
  const queryClient = useQueryClient();
  const { optimisticLike } = usePostsStore();
  const { user } = useAuthStore();

  return useMutation<
    { liked: boolean },
    AxiosError,
    string,
    { previousLiked: boolean }
  >({
    mutationFn: async (postId) => {
      const response = await postsApi.likePost(postId);
      return response.data;
    },
    onMutate: async (postId) => {
      if (!user) return { previousLiked: false };

      await queryClient.cancelQueries({ queryKey: ["posts"] });

      // Get current post to determine previous like state
      const previousPosts = queryClient.getQueryData<Post[]>(["posts"]);
      const post = previousPosts?.find((p) => p.id === postId);
      const previousLiked =
        post?.likes.some((l) => l.userId === user.id) || false;

      // Optimistically update the UI
      optimisticLike(postId, user.id, !previousLiked);

      return { previousLiked };
    },
    onSuccess: (data, postId, context) => {
      if (!user) return;

      // Update the optimistic change with the real data
      optimisticLike(postId, user.id, data.liked);
      // Keep cache fresh
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error, postId, context) => {
      if (!user) return;

      // Revert optimistic update on error
      if (context?.previousLiked !== undefined) {
        optimisticLike(postId, user.id, context.previousLiked);
      }
      // Refetch to reconcile state
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};

// Comment hooks
export const useComments = (postId: string, page = 1, limit = 10) => {
  return useQuery({
    queryKey: ["comments", postId, page, limit],
    queryFn: async () => {
      const response = await postsApi.getComments(postId, page, limit);
      return response.data;
    },
    enabled: !!postId,
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation<Comment, AxiosError, { postId: string; content: string }>({
    mutationFn: async ({ postId, content }) => {
      const response = await postsApi.createComment(postId, content);
      return response.data;
    },
    onSuccess: (newComment, { postId }) => {
      // Invalidate comments for this post
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      // Invalidate posts to update comment count
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};

export const useUpdateComment = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Comment,
    AxiosError,
    { commentId: string; content: string }
  >({
    mutationFn: async ({ commentId, content }) => {
      const response = await postsApi.updateComment(commentId, content);
      return response.data;
    },
    onSuccess: (updatedComment) => {
      // Invalidate comments for the post
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, AxiosError, string>({
    mutationFn: async (commentId) => {
      const response = await postsApi.deleteComment(commentId);
      return response.data;
    },
    onSuccess: (_, commentId) => {
      // Invalidate comments and posts
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};
