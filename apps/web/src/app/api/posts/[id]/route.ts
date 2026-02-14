import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;
        const cacheKey = `post:${id}`;

        // 1. Try Redis
        const cachedPost = await redis.get(cacheKey);
        if (cachedPost) {
            return NextResponse.json(cachedPost);
        }

        // 2. Try Supabase
        const { data: post, error } = await supabase
            .from('posts')
            .select(`
        *,
        profiles:user_id (id, full_name, username, avatar_url, college)
      `)
            .eq('id', id)
            .single();

        if (error) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        // 3. Cache
        await redis.set(cacheKey, JSON.stringify(post), { ex: 300 }); // 5 min cache

        return NextResponse.json(post);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
