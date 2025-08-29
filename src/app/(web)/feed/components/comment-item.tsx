"use client";

import { Edit2, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDeleteComment, useUpdateComment } from "@/hooks/use-posts";
import type { Comment } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

interface CommentItemProps {
  comment: Comment;
  postId: string;
}

export function CommentItem({ comment, postId }: CommentItemProps) {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const updateCommentMutation = useUpdateComment();
  const deleteCommentMutation = useDeleteComment();

  const isOwner = user?.id === comment.user.id;

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(comment.content);
  };

  const handleSave = () => {
    if (editContent.trim() && editContent !== comment.content) {
      updateCommentMutation.mutate(
        { commentId: comment.id, content: editContent.trim(), postId },
        {
          onSuccess: () => {
            setIsEditing(false);
          },
        },
      );
    } else {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent(comment.content);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this comment?")) {
      deleteCommentMutation.mutate({ commentId: comment.id, postId });
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
          {comment.user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 space-y-2">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[80px] resize-none"
            placeholder="Edit your comment..."
          />
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateCommentMutation.isPending}
            >
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={updateCommentMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
        {comment.user.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className="font-semibold text-sm text-gray-900">
            {comment.user.name}
          </span>
          <span className="text-xs text-gray-500">
            @{comment.user.username}
          </span>
          <span className="text-xs text-gray-400">
            {new Date(comment.createdAt).toLocaleDateString()}
          </span>
        </div>
        <p className="text-sm text-gray-800 whitespace-pre-wrap">
          {comment.content}
        </p>
        {isOwner && (
          <div className="flex items-center space-x-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
              onClick={handleEdit}
            >
              <Edit2 className="w-3 h-3 mr-1" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-red-500 hover:text-red-700"
              onClick={handleDelete}
              disabled={deleteCommentMutation.isPending}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
