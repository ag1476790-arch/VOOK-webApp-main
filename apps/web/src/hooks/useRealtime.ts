'use client'
import { supabase } from '@/lib/supabase'
import { useEffect } from 'react'

export const useRealtimePosts = (onNewPost: (post: any) => void) => {
  useEffect(() => {
  const channel = supabase
    .channel("posts-realtime")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "posts",
      },
      (payload) => {
        onNewPost(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [onNewPost]);

}
