"use client";

import { useState, useEffect } from "react";
import { MessageCircle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommentForm } from "./comment-form";
import { CommentItem } from "./comment-item";
import { useComments } from "@/hooks/use-posts";
import type { Post, Comment } from "@/lib/api";

interface CommentsSectionProps {
  post: Post;
}

export function CommentsSection({ post }: CommentsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [allComments, setAllComments] = useState<Comment[]>([]);

  const {
    data: commentsData,
    isLoading,
    refetch,
  } = useComments(post.id, currentPage, 10);

  const comments = commentsData?.comments || [];
  const pagination = commentsData?.pagination;
  const hasComments = allComments.length > 0;
  const hasMoreComments = pagination && currentPage < pagination.totalPages;

  // Accumulate comments from all pages
  useEffect(() => {
    if (commentsData) {
      if (currentPage === 1) {
        setAllComments(comments);
      } else {
        setAllComments((prev) => [...prev, ...comments]);
      }
    }
  }, [commentsData, currentPage, comments]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded && !commentsData) {
      setCurrentPage(1);
      refetch();
    }
  };

  const handleCommentAdded = () => {
    // Reset to first page and refresh
    setCurrentPage(1);
    setAllComments([]);
    refetch();
  };

  const loadMoreComments = () => {
    if (hasMoreComments) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  return (
    <div className="border-t border-gray-200 pt-4">
      {/* Comments header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            {post._count.comments} comments
          </span>
        </div>
        {hasComments && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpanded}
            className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3 h-3 mr-1" />
                Hide
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3 mr-1" />
                Show
              </>
            )}
          </Button>
        )}
      </div>

      {/* Comment form */}
      <div className="mb-4">
        <CommentForm postId={post.id} onCommentAdded={handleCommentAdded} />
      </div>

      {/* Comments list */}
      {isExpanded && (
        <div className="space-y-3">
          {isLoading && currentPage === 1 ? (
            <div className="text-center py-4 text-gray-500">
              Loading comments...
            </div>
          ) : hasComments ? (
            <>
              {allComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  postId={post.id}
                />
              ))}

              {/* Load more button */}
              {hasMoreComments && (
                <div className="text-center pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMoreComments}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      `Load More Comments (${pagination?.total - allComments.length} remaining)`
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No comments yet. Be the first to comment!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
