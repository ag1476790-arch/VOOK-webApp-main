import { useState, useEffect, useRef } from "react";
import { usePosts } from "@/context/PostContext";
import CommunityFeedPost from "./CommunityFeedPost";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Users } from "lucide-react";
import { FeedPostData } from "@/context/PostContext"; // Reusing type or should import from a shared types file? FeedPostData is exported from PostContext.
import { RealtimeSubscription } from "@/lib/supabase/realtime";

interface CommunityFeedProps {
    communityId: string;
    communityName: string;
    filter?: 'all' | 'official' | 'regular';
}

const CommunityFeed = ({ communityId, communityName, filter = 'regular' }: CommunityFeedProps) => {
    const { currentUser } = usePosts(); // Only need user, not global posts
    const [posts, setPosts] = useState<FeedPostData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCommunityPosts = async () => {
        setIsLoading(true);
        console.log("Fetching community posts for:", communityName, communityId);
        try {
            // Fetch posts where community_id equals the community ID
            // Fallback to community_tag if needed handled by migration, here we strictly use ID for new standard
            // Fetch posts from new Server API (cached via Redis)
            const params = new URLSearchParams();
            params.append('communityId', communityId);
            if (filter) params.append('filter', filter);

            const res = await fetch(`/api/feed?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch feed');

            const postsData = await res.json();


            // Fetch likes/bookmarks for this user within this context
            let userLikes: string[] = [];

            if (currentUser?.id) {
                const { data: likes } = await supabase
                    .from('likes')
                    .select('post_id')
                    .eq('user_id', currentUser.id)
                    .in('post_id', (postsData || []).map((p: any) => p.id));

                if (likes) userLikes = likes.map(l => l.post_id);
            }

            const formattedPosts: FeedPostData[] = (postsData || []).map((p: any) => ({
                id: p.id,
                author: {
                    name: p.profiles?.full_name || "Unknown",
                    username: p.profiles?.username || "@unknown",
                    avatar: p.profiles?.avatar_url,
                    initials: (p.profiles?.full_name || "U")[0].toUpperCase(),
                    college: p.profiles?.college || "Campus",
                    id: p.profiles?.id
                },
                communityId: p.community_id,
                communityTag: p.community_tag,
                isOfficial: p.is_official,
                isAnonymous: p.is_anonymous,
                timestamp: new Date(p.created_at).toLocaleDateString(),
                content: p.content,
                images: p.image_urls,
                hasVideo: !!p.video_url,
                videoThumbnail: undefined,
                upvotes: p.upvotes || 0,
                comments: p.comments_count || 0,
                isUpvoted: userLikes.includes(p.id),
                isBookmarked: false, // Simplifying for now
                previewComments: [],
            }));

            setPosts(formattedPosts);

        } catch (error: any) {
            console.error("Error fetching community posts:", error);
            toast.error("Failed to load posts");
        } finally {
            setIsLoading(false);
        }
    };

    const subscriptionRef = useRef<RealtimeSubscription | null>(null);

    useEffect(() => {
        if (communityId) {
            fetchCommunityPosts();
        }

        // Realtime Subscription SCOPED to this community (with retry logic)
        const subscription = new RealtimeSubscription({
            channel: `community_posts:${communityId}`,
            table: 'posts',
            event: '*',
            filter: `community_id=eq.${communityId}`,
            onInsert: (payload) => {
                console.log("Community Realtime Event:", payload);
                fetchCommunityPosts(); // Brute force refresh for safety
            },
            onUpdate: (payload) => {
                console.log("Community Realtime Event:", payload);
                fetchCommunityPosts();
            },
            onDelete: (payload) => {
                console.log("Community Realtime Event:", payload);
                fetchCommunityPosts();
            },
            onError: (error) => console.error('Community feed subscription error:', error),
        });

        subscriptionRef.current = subscription;
        subscription.subscribe().catch((error) => {
            console.error('Failed to subscribe to community feed:', error);
        });

        return () => {
            subscription.unsubscribe();
            subscriptionRef.current = null;
        };
    }, [communityId, filter]);

    const handleDelete = async (postId: string) => {
        try {
            const { error } = await supabase.from('posts').delete().eq('id', postId);
            if (error) throw error;
            toast.success("Post deleted");
            setPosts(prev => prev.filter(p => p.id !== postId));
        } catch (error: any) {
            toast.error("Failed to delete: " + error.message);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border/50">
                <Users className="w-10 h-10 mb-3 opacity-20" />
                <p>No {filter === 'official' ? 'announcements' : 'community posts'} yet.</p>
                {filter === 'regular' && <p className="text-xs">Be the first to start a conversation!</p>}
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-20">
            {posts.map(post => (
                <CommunityFeedPost
                    key={post.id}
                    post={post}
                    onDelete={handleDelete}
                />
            ))}
        </div>
    );
};

export default CommunityFeed;
