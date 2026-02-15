import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get("communityId");
    const filter = searchParams.get("filter") || "regular";

    // Cache key
    const cacheKey = communityId
      ? `feed:community:${communityId}:${filter}`
      : `feed:global:${filter}`;

    // 1️⃣ Try Redis
    const cachedFeed = await redis.get(cacheKey);

    // ✅ Proper type check (THIS FIXES YOUR BUILD ERROR)
    if (typeof cachedFeed === "string") {
      const parsedFeed = JSON.parse(cachedFeed);

      const response = NextResponse.json(parsedFeed);
      response.headers.set(
        "Cache-Control",
        "public, s-maxage=60, stale-while-revalidate=120"
      );
      response.headers.set("X-Cache", "HIT");

      return response;
    }

    // 2️⃣ Fetch from Supabase if cache miss
    let query = supabase
      .from("posts")
      .select(
        `
        *,
        profiles!inner (
          id,
          username,
          full_name,
          avatar_url,
          college
        )
      `
      );

    if (communityId) {
      query = query.eq("community_id", communityId);
    }

    if (filter === "official") {
      query = query.eq("is_official", true);
    } else if (filter === "regular") {
      query = query.eq("is_official", false);
    }

    const { data: posts, error } = await query
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Supabase Feed Error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // 3️⃣ Save to Redis (60s TTL)
    await redis.set(cacheKey, JSON.stringify(posts), { ex: 60 });

    const response = NextResponse.json(posts);
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=120"
    );
    response.headers.set("X-Cache", "MISS");

    return response;
  } catch (error) {
    console.error("Feed API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
