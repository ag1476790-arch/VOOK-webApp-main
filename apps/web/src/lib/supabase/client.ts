import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    },
    realtime: {
        // Enable logging for debugging WebSocket connections
        logger: (kind: string, msg: string, data?: any) => {
            if (process.env.NODE_ENV === 'development') {
                console.log(`[Realtime ${kind}] ${msg}`, data || '');
            }
        },
        logLevel: process.env.NODE_ENV === 'development' ? 'info' : 'error',
        // WebSocket connection parameters
        params: {
            eventsPerSecond: 10
        },
    },
    global: {
        headers: {
            'x-client-info': 'vook-webapp@1.0.0'
        }
    }
});
