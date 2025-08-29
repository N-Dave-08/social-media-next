"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateComment } from "@/hooks/use-posts";

interface CommentFormProps {
  postId: string;
  onCommentAdded?: () => void;
}

export function CommentForm({ postId, onCommentAdded }: CommentFormProps) {
  const [content, setContent] = useState("");
  const createCommentMutation = useCreateComment();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      const commentContent = content.trim();
      // Clear content immediately for better UX
      setContent("");

      createCommentMutation.mutate(
        { postId, content: commentContent },
        {
          onSuccess: () => {
            onCommentAdded?.();
          },
          onError: () => {
            // Restore content if there's an error
            setContent(commentContent);
          },
        },
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment..."
        className="resize-none min-h-[80px]"
        maxLength={500}
      />
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">{content.length}/500</div>
        <Button type="submit" size="sm" disabled={!content.trim()}>
          <Send className="w-4 h-4 mr-2" />
          Comment
        </Button>
      </div>
    </form>
  );
}
