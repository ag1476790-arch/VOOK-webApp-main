import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from './client';

export interface RealtimeSubscriptionOptions {
    channel: string;
    table: string;
    schema?: string;
    event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
    filter?: string;
    onInsert?: (payload: RealtimePostgresChangesPayload<any>) => void;
    onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
    onDelete?: (payload: RealtimePostgresChangesPayload<any>) => void;
    onError?: (error: Error) => void;
    maxRetries?: number;
    retryDelay?: number;
}

export class RealtimeSubscription {
    private channel: RealtimeChannel | null = null;
    private options: RealtimeSubscriptionOptions;
    private retryCount = 0;
    private retryTimeout: NodeJS.Timeout | null = null;
    private isSubscribed = false;

    constructor(options: RealtimeSubscriptionOptions) {
        this.options = {
            schema: 'public',
            event: '*',
            maxRetries: 5,
            retryDelay: 1000,
            ...options,
        };
    }

    async subscribe(): Promise<RealtimeChannel> {
        if (this.isSubscribed && this.channel) {
            return this.channel;
        }

        try {
            const channelName = this.options.channel;
            this.channel = supabase.channel(channelName);

            // Set up event handlers
            if (this.options.onInsert || this.options.event === '*' || this.options.event === 'INSERT') {
                (this.channel as any).on(
                    'postgres_changes',

                    {
                        event: 'INSERT',
                        schema: this.options.schema,
                        table: this.options.table,
                        filter: this.options.filter,
                    },
                    (payload:any) => {
                        this.options.onInsert?.(payload);
                    }
                );
            }

            if (this.options.onUpdate || this.options.event === '*' || this.options.event === 'UPDATE') {
                (this.channel as any).on(
                    'postgres_changes',

                    {
                        event: 'UPDATE',
                        schema: this.options.schema,
                        table: this.options.table,
                        filter: this.options.filter,
                    },
                    (payload:any) => {
                        this.options.onUpdate?.(payload);
                    }
                );
            }

            if (this.options.onDelete || this.options.event === '*' || this.options.event === 'DELETE') {
                (this.channel as any).on(
                    'postgres_changes',

                    {
                        event: 'DELETE',
                        schema: this.options.schema,
                        table: this.options.table,
                        filter: this.options.filter,
                    },
                    (payload:any) => {
                        this.options.onDelete?.(payload);
                    }
                );
            }

            // Handle subscription status
            this.channel.on('system', {}, (payload) => {
                if (payload.status === 'SUBSCRIBED') {
                    this.isSubscribed = true;
                    this.retryCount = 0;
                } else if (payload.status === 'CHANNEL_ERROR') {
                    this.handleError(new Error(`Channel error: ${payload.error}`));
                } else if (payload.status === 'TIMED_OUT') {
                    this.handleError(new Error('Channel subscription timed out'));
                }
            });

            // Subscribe with error handling
            this.channel.subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    this.isSubscribed = true;
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('Realtime channel error');
                }
            });


            return this.channel;
        } catch (error) {
            this.handleError(error as Error);
            throw error;
        }
    }

    private handleError(error: Error) {
        this.isSubscribed = false;
        this.options.onError?.(error);

        // Retry logic
        if (this.retryCount < (this.options.maxRetries || 5)) {
            this.retryCount++;
            const delay = (this.options.retryDelay || 1000) * this.retryCount;

            console.warn(`Realtime subscription error, retrying in ${delay}ms (attempt ${this.retryCount}/${this.options.maxRetries}):`, error);

            this.retryTimeout = setTimeout(() => {
                this.subscribe().catch((err) => {
                    console.error('Retry subscription failed:', err);
                });
            }, delay);
        } else {
            console.error('Max retries reached for realtime subscription:', error);
        }
    }

    unsubscribe() {
        if (this.retryTimeout) {
            clearTimeout(this.retryTimeout);
            this.retryTimeout = null;
        }

        if (this.channel) {
            supabase.removeChannel(this.channel);
            this.channel = null;
            this.isSubscribed = false;
        }
    }

    getChannel(): RealtimeChannel | null {
        return this.channel;
    }

    isActive(): boolean {
        return this.isSubscribed && this.channel !== null;
    }
}

// Helper function for easy subscription
export function subscribeToRealtime(options: RealtimeSubscriptionOptions): RealtimeSubscription {
    const subscription = new RealtimeSubscription(options);
    subscription.subscribe().catch((error) => {
        console.error('Failed to subscribe to realtime:', error);
    });
    return subscription;
}
