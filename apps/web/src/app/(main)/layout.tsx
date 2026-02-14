"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Background3D from "@/components/Background3D";
import { supabase } from "@/lib/supabase/client";
import TermsModal from "@/components/TermsModal";
import { Loader2 } from "lucide-react";
import GlobalChatListener from "@/components/chat/GlobalChatListener";

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [showTerms, setShowTerms] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        let mounted = true;

        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (mounted) {
                    setIsAuthenticated(!!session);
                    if (session) {
                        setUserId(session.user.id);

                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('terms_accepted')
                            .eq('id', session.user.id)
                            .single();

                        if (profile && profile.terms_accepted === false) {
                            setShowTerms(true);
                        }
                    } else {
                        router.push("/login");
                    }
                }
            } catch (error) {
                console.error("Auth check error:", error);
                if (mounted) setIsAuthenticated(false);
            }
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (mounted) {
                if (session) {
                    setIsAuthenticated(true);
                    setUserId(session.user.id);
                } else {
                    setIsAuthenticated(false);
                    router.push("/login");
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [router]);

    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null; // Will redirect
    }

    return (
        <div className="min-h-screen relative">
            <div className="fixed inset-0 z-[-1]">
                <Background3D />
            </div>
            {showTerms && userId && (
                <TermsModal
                    isOpen={showTerms}
                    userId={userId}
                    onComplete={() => {
                        setShowTerms(false);
                    }}
                />
            )}
            <GlobalChatListener />
            {children}
        </div>
    );
}
