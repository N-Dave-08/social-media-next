"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePost } from "@/hooks/use-posts";

const createPostSchema = z.object({
  content: z
    .string()
    .min(1, "Post cannot be empty")
    .max(280, "Max 280 characters"),
});

type CreatePostForm = z.infer<typeof createPostSchema>;

export function CreatePost() {
  const createPostMutation = useCreatePost();

  const form = useForm<CreatePostForm>({
    resolver: zodResolver(createPostSchema),
    defaultValues: { content: "" },
  });

  useEffect(() => {
    if (createPostMutation.isSuccess) {
      form.reset({ content: "" });
    }
  }, [createPostMutation.isSuccess, form]);

  const onSubmit = (data: CreatePostForm) => {
    createPostMutation.mutate({ content: data.content.trim() });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="What's happening?"
                    className="resize-none"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {form.watch("content").length}/280
            </div>
            <Button type="submit" disabled={createPostMutation.isPending}>
              {createPostMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Posting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" /> Post
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
