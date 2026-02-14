-- Indexes for performance optimization

-- 1. Posts Table
-- Speed up fetching posts by user (Profile Feed)
CREATE INDEX IF NOT EXISTS idx_posts_user_id_created_at ON public.posts(user_id, created_at DESC);

-- Speed up fetching latest posts (Global Feed) - community_tag might be relevant later
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- Speed up " Trending/Top" posts if we sort by upvotes
CREATE INDEX IF NOT EXISTS idx_posts_upvotes ON public.posts(upvotes DESC);


-- 2. Likes Table
-- Speed up checking "Has user liked post?"
CREATE INDEX IF NOT EXISTS idx_likes_user_post ON public.likes(user_id, post_id);

-- Speed up counting likes for a post
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);


-- 3. Comments (assuming a comments table exists or will act on story_comments/future posts_comments)
-- Note: schema.sql showed `story_comments` but no `post_comments` yet? 
-- Checking schema again, `posts` has `comments_count`. If there is a comments table for posts (likely missing in schema.sql or unrelated), we index it.
-- Based on standard patterns:
-- CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);


-- 4. Follows Table
-- Speed up "Am I following this user?"
CREATE INDEX IF NOT EXISTS idx_follows_follower_following ON public.follows(follower_id, following_id);

-- Speed up "Get my followers"
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);

-- Speed up "Get who I am following"
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);


-- 5. Notifications
-- Speed up fetching user's notifications
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created_at ON public.notifications(recipient_id, created_at DESC);
