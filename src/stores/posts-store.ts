import { create } from "zustand";
import type { Post, Comment } from "@/lib/api";

interface PostsState {
  posts: Post[];
  isLoading: boolean;
  error: string | null;
}

interface PostsActions {
  setPosts: (posts: Post[]) => void;
  addPost: (post: Post) => void;
  updatePost: (postId: string, updates: Partial<Post>) => void;
  removePost: (postId: string) => void;
  replacePost: (oldPostId: string, newPost: Post) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearPosts: () => void;
  // Optimistic updates
  optimisticLike: (postId: string, userId: string, liked: boolean) => void;
  // Comment actions
  addComment: (postId: string, comment: Comment) => void;
  updateComment: (
    postId: string,
    commentId: string,
    updates: Partial<Comment>,
  ) => void;
  removeComment: (postId: string, commentId: string) => void;
}

type PostsStore = PostsState & PostsActions;

export const usePostsStore = create<PostsStore>((set) => ({
  // State
  posts: [],
  isLoading: false,
  error: null,

  // Actions
  setPosts: (posts) => {
    set({ posts, error: null });
  },

  addPost: (post) => {
    set((state) => ({
      posts: [post, ...state.posts],
    }));
  },

  updatePost: (postId, updates) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId ? { ...post, ...updates } : post,
      ),
    }));
  },

  removePost: (postId) => {
    set((state) => ({
      posts: state.posts.filter((post) => post.id !== postId),
    }));
  },

  replacePost: (oldPostId, newPost) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === oldPostId ? newPost : post,
      ),
    }));
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setError: (error) => {
    set({ error });
  },

  clearPosts: () => {
    set({ posts: [], error: null });
  },

  // Optimistic like/unlike
  optimisticLike: (postId, userId, liked) => {
    set((state) => ({
      posts: state.posts.map((post) => {
        if (post.id === postId) {
          const existingLikes = Array.isArray(post.likes) ? post.likes : [];
          const newLikes = liked
            ? [...existingLikes, { userId }]
            : existingLikes.filter((like) => like.userId !== userId);

          return {
            ...post,
            likes: newLikes,
            _count: {
              ...post._count,
              likes: newLikes.length,
            },
          } as Post;
        }
        return post;
      }),
    }));
  },

  // Comment actions
  addComment: (postId, comment) => {
    set((state) => ({
      posts: state.posts.map((post) => {
        if (post.id === postId) {
          const existingComments = post.comments || [];
          return {
            ...post,
            comments: [comment, ...existingComments],
            _count: {
              ...post._count,
              comments: post._count.comments + 1,
            },
          } as Post;
        }
        return post;
      }),
    }));
  },

  updateComment: (postId, commentId, updates) => {
    set((state) => ({
      posts: state.posts.map((post) => {
        if (post.id === postId && post.comments) {
          return {
            ...post,
            comments: post.comments.map((comment) =>
              comment.id === commentId ? { ...comment, ...updates } : comment,
            ),
          } as Post;
        }
        return post;
      }),
    }));
  },

  removeComment: (postId, commentId) => {
    set((state) => ({
      posts: state.posts.map((post) => {
        if (post.id === postId && post.comments) {
          return {
            ...post,
            comments: post.comments.filter(
              (comment) => comment.id !== commentId,
            ),
            _count: {
              ...post._count,
              comments: Math.max(0, post._count.comments - 1),
            },
          } as Post;
        }
        return post;
      }),
    }));
  },
}));
