import { useEffect } from 'react';
import { useChat } from '@/context/ChatContext';

/**
 * Component to update browser tab title with unread message count
 * Shows "(count) IT TeamHub" when there are unread messages
 * Returns to "IT TeamHub" when all messages are read
 */
export const DocumentTitleUpdater = () => {
    const { unreadTotal } = useChat();

    useEffect(() => {
        if (unreadTotal > 0) {
            document.title = `(${unreadTotal}) IT TeamHub`;
        } else {
            document.title = 'IT TeamHub';
        }
    }, [unreadTotal]);

    return null; // This component doesn't render anything
};
