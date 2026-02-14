export interface ChatListItem {
    chatId: string;
    userId: string;
    name: string;
    username: string;
    avatar?: string;
    initials: string;
    lastMessage: string;
    timestamp: string; // ISO string
    unreadCount: number;
    isOnline?: boolean;
    isGroup?: boolean;
    isPinned?: boolean; // Local state for demo
    isMuted?: boolean;  // Local state for demo
}
