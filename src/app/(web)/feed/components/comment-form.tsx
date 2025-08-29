"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
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
      createCommentMutation.mutate(
        { postId, content: content.trim() },
        {
          onSuccess: () => {
            setContent("");
            onCommentAdded?.();
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
        <Button
          type="submit"
          size="sm"
          disabled={!content.trim() || createCommentMutation.isPending}
        >
          {createCommentMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Posting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Comment
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
