'use client'
import { supabase } from '@/lib/supabase'
import { useEffect, useCallback, useRef } from 'react'

export const useRealtimePosts = (callback: (newPost: any) => void) => {
  const callbackRef = useRef(callback)
  
  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    let mounted = true
    let channel: any = null

    const setupSubscription = () => {
      channel = supabase
        .channel('posts-realtime')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'posts' 
          }, 
          (payload) => {
            if (mounted) {
              console.log('🔔 New post received:', payload.new)
              callbackRef.current(payload.new)
            }
          }
        )
        .on('postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'posts'
          },
          (payload) => {
            if (mounted) {
              console.log('🔄 Post updated:', payload.new)
              callbackRef.current(payload.new)
            }
          }
        )
        .on('postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'posts'
          },
          (payload) => {
            if (mounted) {
              console.log('🗑️ Post deleted:', payload.old)
            }
          }
        )
        .subscribe((status) => {
          console.log('🔌 Realtime status:', status)
          if (status === 'SUBSCRIBED') {
            console.log('✅ Supabase Realtime ACTIVE')
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('❌ Realtime connection error:', status)
            // Retry after delay
            setTimeout(() => {
              if (mounted) {
                supabase.removeChannel(channel)
                setupSubscription()
              }
            }, 3000)
          }
        })
    }

    setupSubscription()

    return () => {
      mounted = false
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [])
}
