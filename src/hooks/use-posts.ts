import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  type Comment,
  type CreatePostData,
  type Pagination,
  type Post,
  postsApi,
} from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { usePostsStore } from "@/stores/posts-store";

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
    onSuccess: (_, _postId, _context) => {
      if (!user) return;

      // Let the server response provide the final accurate count
      // The optimistic update was already applied in onMutate
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (_error, postId, context) => {
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
  const { user } = useAuthStore();
  const { addComment } = usePostsStore();

  return useMutation<
    Comment,
    AxiosError,
    { postId: string; content: string },
    {
      previousComments:
        | { comments: Comment[]; pagination: Pagination }
        | undefined;
      optimisticComment: Comment;
    }
  >({
    mutationFn: async ({ postId, content }) => {
      const response = await postsApi.createComment(postId, content);
      return response.data;
    },
    onMutate: async ({ postId, content }) => {
      if (!user)
        return {
          previousComments: undefined,
          optimisticComment: {} as Comment,
        };

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["comments", postId] });

      // Snapshot the previous value
      const previousComments = queryClient.getQueryData<{
        comments: Comment[];
        pagination: Pagination;
      }>(["comments", postId, 1, 10]);

      // Create optimistic comment
      const optimisticComment: Comment = {
        id: `temp-${Date.now()}`, // Temporary ID
        content,
        createdAt: new Date().toISOString(),
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          avatar: user.avatar,
        },
      };

      // Optimistically update comments in React Query cache
      queryClient.setQueryData<{ comments: Comment[]; pagination: Pagination }>(
        ["comments", postId, 1, 10],
        (old) => {
          if (!old) {
            return {
              comments: [optimisticComment],
              pagination: {
                page: 1,
                limit: 10,
                total: 1,
                totalPages: 1,
              },
            };
          }
          return {
            ...old,
            comments: [optimisticComment, ...old.comments],
            pagination: {
              ...old.pagination,
              total: old.pagination.total + 1,
            },
          };
        },
      );

      // Also optimistically update the posts list to increment comment count in React Query cache
      queryClient.setQueryData<Post[]>(["posts"], (old) => {
        if (!old) return old;
        return old.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              _count: {
                ...post._count,
                comments: post._count.comments + 1,
              },
            };
          }
          return post;
        });
      });

      // Update the Zustand store as well to keep it in sync
      addComment(postId, optimisticComment);

      return { previousComments, optimisticComment };
    },
    onSuccess: (newComment, { postId }, context) => {
      if (!context) return;

      // Update the optimistic comment with the real one in React Query cache
      queryClient.setQueryData<{ comments: Comment[]; pagination: Pagination }>(
        ["comments", postId, 1, 10],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            comments: old.comments.map((comment) =>
              comment.id === context.optimisticComment.id
                ? newComment
                : comment,
            ),
          };
        },
      );
    },
    onError: (_error, { postId }, context) => {
      if (!context) return;

      // Revert optimistic updates on error in React Query cache
      queryClient.setQueryData(
        ["comments", postId, 1, 10],
        context.previousComments,
      );

      // Revert post comment count in React Query cache
      queryClient.setQueryData<Post[]>(["posts"], (old) => {
        if (!old) return old;
        return old.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              _count: {
                ...post._count,
                comments: Math.max(0, post._count.comments - 1),
              },
            };
          }
          return post;
        });
      });

      // Note: We don't need to revert the Zustand store here because
      // the optimistic comment will be replaced with the real one on success
      // and if there's an error, the user will see the comment disappear
    },
  });
};

export const useUpdateComment = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Comment,
    AxiosError,
    { commentId: string; content: string; postId: string }
  >({
    mutationFn: async ({ commentId, content }) => {
      const response = await postsApi.updateComment(commentId, content);
      return response.data;
    },
    onSuccess: (_, { postId }) => {
      // Invalidate comments for the specific post only
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      // Invalidate posts to update comment count
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { message: string },
    AxiosError,
    { commentId: string; postId: string }
  >({
    mutationFn: async ({ commentId }) => {
      const response = await postsApi.deleteComment(commentId);
      return response.data;
    },
    onSuccess: (_, { postId }) => {
      // Invalidate comments for the specific post only
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      // Invalidate posts to update comment count
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};
