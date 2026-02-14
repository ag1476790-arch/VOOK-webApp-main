import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

// Initialize Supabase client for server-side usage
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const communityId = searchParams.get('communityId');
        const filter = searchParams.get('filter') || 'regular'; // Default to regular for community feeds usually

        // Generate dynamic cache key
        const cacheKey = communityId
            ? `feed:community:${communityId}:${filter}`
            : `feed:global:${filter}`;

        // 1. Try fetching from Redis
        const cachedFeed = await redis.get(cacheKey);
        if (cachedFeed) {
            const response = NextResponse.json(JSON.parse(cachedFeed));
            response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
            response.headers.set('X-Cache', 'HIT');
            return response;
        }

        // 2. If Miss, fetch from Supabase
        let query = supabase
            .from('posts')
            .select(`
        *,
        profiles!inner (
          id,
          username,
          full_name,
          avatar_url,
          college
        )
      `);

        // Apply Filters
        if (communityId) {
            query = query.eq('community_id', communityId);
        }

        if (filter === 'official') {
            query = query.eq('is_official', true);
        } else if (filter === 'regular') {
            query = query.eq('is_official', false);
        }

        const { data: posts, error } = await query
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error('Supabase Feed Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 3. Cache the result in Redis
        // Set TTL to 60 seconds (short cache for freshness)
        await redis.set(cacheKey, JSON.stringify(posts), { ex: 60 });
        
        // Set cache headers for CDN
        const response = NextResponse.json(posts);
        response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
        response.headers.set('X-Cache', 'MISS');
        return response;
    } catch (error) {
        console.error('Feed API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
