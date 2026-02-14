'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { PostProvider } from '@/context/PostContext';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            <PostProvider>
                <TooltipProvider>
                    {children}
                    <Toaster />
                </TooltipProvider>
            </PostProvider>
        </QueryClientProvider>
    );
}
