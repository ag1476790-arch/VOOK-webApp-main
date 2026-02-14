# Supabase WebSocket Fix - Implementation Guide

## ✅ Files Created/Updated

1. **`.env.local`** - Environment variables (CREATE MANUALLY)
2. **`client.ts`** - Updated with realtime WebSocket configuration
3. **`server.ts`** - Server-side client for SSR
4. **`realtime.ts`** - Realtime utilities with retry logic
5. **`useRealtime.ts`** - React hook for managing subscriptions
6. **`next.config.ts`** - Updated with WebSocket support

## 🚀 Quick Start

### 1. Create `.env.local` file

Create `apps/web/.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://gjxbxjzjikrwfhqwafic.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqeGJ4anpraWtyd2ZocXdhZmljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NTY0NDksImV4cCI6MjA4NjQ1NjQ0OX0.NGJQTL9gTzCnjukI6QKpgQ2sBEyIoXzVlKf_TSNH5Gc
```

### 2. Use the Updated Client

The client now includes:
- ✅ WebSocket transport configuration
- ✅ Heartbeat monitoring
- ✅ Debug logging (development only)
- ✅ Automatic reconnection handling

### 3. Migrate Existing Subscriptions

**Before:**
```typescript
const channel = supabase
  .channel('posts')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {})
  .subscribe();
```

**After (Option 1 - Using Hook):**
```typescript
import { useRealtime } from '@/hooks/useRealtime';

useRealtime({
  channel: 'posts',
  table: 'posts',
  event: '*',
  onInsert: (payload) => {
    // Handle insert
  },
  onUpdate: (payload) => {
    // Handle update
  },
  onError: (error) => {
    console.error('Realtime error:', error);
  }
});
```

**After (Option 2 - Using Utility Class):**
```typescript
import { RealtimeSubscription } from '@/lib/supabase/realtime';

const subscription = new RealtimeSubscription({
  channel: 'posts',
  table: 'posts',
  event: '*',
  onInsert: (payload) => {
    // Handle insert
  },
  maxRetries: 5,
  retryDelay: 1000
});

await subscription.subscribe();

// Cleanup
subscription.unsubscribe();
```

## 🔧 Features

### Automatic Retry Logic
- Configurable max retries (default: 5)
- Exponential backoff
- Error callbacks

### Connection Monitoring
- Heartbeat detection
- Silent disconnection handling
- Status callbacks

### Development Debugging
- Console logging in development
- Connection status tracking
- Error reporting

## 📝 Migration Example: PostContext.tsx

Update your `PostContext.tsx` to use the new utilities:

```typescript
import { useRealtime } from '@/hooks/useRealtime';

// In your component:
useRealtime({
  channel: 'public:posts',
  table: 'posts',
  event: '*',
  onInsert: () => {
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  },
  onUpdate: () => {
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  },
  onDelete: () => {
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  }
});
```

## 🐛 Troubleshooting

### WebSocket Still Failing?

1. **Check environment variables:**
   ```bash
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

2. **Enable debug logging:**
   - Already enabled in development mode
   - Check browser console for `[Realtime]` messages

3. **Verify Supabase project:**
   - Ensure Realtime is enabled in Supabase dashboard
   - Check project URL matches your `.env.local`

4. **Network issues:**
   - Check firewall/proxy settings
   - Verify WebSocket connections aren't blocked

## 🎯 Production Checklist

- [ ] Set environment variables in Vercel
- [ ] Test WebSocket connections
- [ ] Monitor connection stability
- [ ] Set up error tracking (Sentry)
- [ ] Configure rate limiting if needed
