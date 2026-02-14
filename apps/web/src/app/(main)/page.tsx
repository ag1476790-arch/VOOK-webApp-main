'use client';

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import CreatePostBox, { FilterTab } from "@/components/CreatePostBox";
import SocialFeed from "@/components/SocialFeed";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { usePosts } from "@/context/PostContext";

interface UserProfile {
    id: string;
    full_name: string;
    username: string;
    avatar_url?: string;
    bio?: string;
    college?: string;
    isFollowing?: boolean;
}

export default function Home() {
    const { fetchPosts, isFollowing, followUser, unfollowUser, currentUser } = usePosts();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [people, setPeople] = useState<UserProfile[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [activeFilter, setActiveFilter] = useState<FilterTab>("campus");

    // Sync Filter with Backend
    useEffect(() => {
        fetchPosts(activeFilter);
    }, [activeFilter, fetchPosts]);

    // Search Logic with Debounce
    useEffect(() => {
        const fetchPeople = async () => {
            if (!searchQuery.trim()) {
                setPeople([]);
                return;
            }

            setIsSearching(true);
            try {
                let query = supabase.from('profiles').select('*');
                query = query.or(`full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`);

                if (currentUser?.id) {
                    query = query.neq('id', currentUser.id);
                }

                const { data: profiles, error } = await query.limit(5);

                if (error) throw error;

                setPeople(profiles?.map(p => ({ ...p, isFollowing: false })) || []);

            } catch (error) {
                console.error("Error fetching people:", error);
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(fetchPeople, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, currentUser?.id]);

    const handleFollowUser = async (userId: string, currentStatus: boolean | undefined) => {
        if (!currentUser?.id) {
            toast.error("Please login to follow users");
            return;
        }

        try {
            if (currentStatus) {
                await unfollowUser(userId);
                toast.success("Unfollowed");
            } else {
                await followUser(userId);
                toast.success("Following");
            }
        } catch (e) {
            // toast handled in context
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <Header />

            <main className="flex flex-col gap-4 py-4 px-4 max-w-xl mx-auto">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-card border-border rounded-full h-12 shadow-sm focus:ring-1 focus:ring-primary/20"
                    />
                </div>

                {/* Search Results */}
                <AnimatePresence>
                    {searchQuery && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2 overflow-hidden"
                        >
                            {isSearching ? (
                                <div className="text-center py-4 text-xs text-muted-foreground">Searching...</div>
                            ) : people.length > 0 ? (
                                people.map((person) => {
                                    const isUserFollowing = isFollowing(person.id);
                                    return (
                                        <div key={person.id} className="flex items-center justify-between p-3 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl hover:bg-card transition-colors">
                                            <div className="flex items-center gap-3 cursor-pointer overflow-hidden" onClick={() => router.push(`/profile/${person.id}`)}>
                                                <Avatar className="h-10 w-10 border border-border">
                                                    <AvatarImage src={person.avatar_url} />
                                                    <AvatarFallback>{(person.full_name || "U")[0]}</AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <h3 className="font-medium text-sm text-foreground truncate">{person.full_name}</h3>
                                                    <p className="text-xs text-muted-foreground truncate">{person.college || "@" + person.username}</p>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant={isUserFollowing ? "secondary" : "default"}
                                                onClick={() => handleFollowUser(person.id, isUserFollowing)}
                                                className="h-8 px-3 text-xs rounded-full"
                                            >
                                                {isUserFollowing ? "Following" : "Follow"}
                                            </Button>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="text-center py-4 text-xs text-muted-foreground">
                                    No users found
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                <CreatePostBox activeFilter={activeFilter} onFilterChange={setActiveFilter} />
                <SocialFeed filter={activeFilter} />
            </main>

            <BottomNav />
        </div>
    );
}
