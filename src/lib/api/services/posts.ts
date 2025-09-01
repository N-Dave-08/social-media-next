import { type AxiosResponse } from "axios";
import api from "../client";
import type { Post, Comment, Pagination, CreatePostData } from "../types";

// Posts API
export const postsApi = {
  getPosts: (): Promise<AxiosResponse<Post[]>> => api.get("/posts"),

  createPost: (data: CreatePostData): Promise<AxiosResponse<Post>> =>
    api.post("/posts", data),

  likePost: (postId: string): Promise<AxiosResponse<{ liked: boolean }>> =>
    api.post(`/posts/${postId}/like`),

  // Comment functions
  getComments: (
    postId: string,
    page = 1,
    limit = 10,
  ): Promise<AxiosResponse<{ comments: Comment[]; pagination: Pagination }>> =>
    api.get(`/posts/${postId}/comments?page=${page}&limit=${limit}`),

  createComment: (
    postId: string,
    content: string,
  ): Promise<AxiosResponse<Comment>> =>
    api.post(`/posts/${postId}/comments`, { content }),

  updateComment: (
    commentId: string,
    content: string,
  ): Promise<AxiosResponse<Comment>> =>
    api.put(`/comments/${commentId}`, { content }),

  deleteComment: (
    commentId: string,
  ): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/comments/${commentId}`),
};
