import { create } from "zustand";
import type { Post } from "@/lib/api";

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
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearPosts: () => void;
  // Optimistic updates
  optimisticLike: (postId: string, userId: string, liked: boolean) => void;
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
          const newLikes = liked
            ? [...post.likes, { userId }]
            : post.likes.filter((like) => like.userId !== userId);

          return {
            ...post,
            likes: newLikes,
            _count: {
              ...post._count,
              likes: newLikes.length,
            },
          };
        }
        return post;
      }),
    }));
  },
}));
