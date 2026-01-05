import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { Message } from '../../services/chatService';

interface MessageItemProps {
    message: Message;
    showSender?: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, showSender = true }) => {
    const { user } = useAuth();
    const isOwn = message.senderId === user?.id;

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    if (message.isDeleted) {
        return (
            <View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}>
                <View style={[styles.bubble, styles.deletedBubble]}>
                    <Text style={styles.deletedText}>Tin nhắn đã bị xóa</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}>
            {!isOwn && showSender && (
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {message.sender?.name?.charAt(0).toUpperCase() || '?'}
                    </Text>
                </View>
            )}

            <View style={[styles.bubbleWrapper, isOwn && styles.ownBubbleWrapper]}>
                {!isOwn && showSender && (
                    <Text style={styles.senderName}>{message.sender?.name || 'Unknown'}</Text>
                )}

                <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
                    <Text style={[styles.content, isOwn && styles.ownContent]}>
                        {message.content}
                    </Text>

                    <View style={styles.metaRow}>
                        {message.isEdited && (
                            <Text style={[styles.edited, isOwn && styles.ownMeta]}>(đã sửa) </Text>
                        )}
                        <Text style={[styles.time, isOwn && styles.ownMeta]}>
                            {formatTime(message.createdAt)}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.md,
        marginVertical: 2,
    },
    ownContainer: {
        justifyContent: 'flex-end',
    },
    otherContainer: {
        justifyContent: 'flex-start',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.xs,
    },
    avatarText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.text,
    },
    bubbleWrapper: {
        maxWidth: '75%',
    },
    ownBubbleWrapper: {
        alignItems: 'flex-end',
    },
    senderName: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textMuted,
        marginBottom: 2,
        marginLeft: 4,
    },
    bubble: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radius.lg,
    },
    ownBubble: {
        backgroundColor: Colors.primary,
        borderBottomRightRadius: 4,
    },
    otherBubble: {
        backgroundColor: Colors.card,
        borderBottomLeftRadius: 4,
    },
    deletedBubble: {
        backgroundColor: Colors.secondary,
    },
    content: {
        fontSize: 15,
        color: Colors.text,
        lineHeight: 20,
    },
    ownContent: {
        color: Colors.white,
    },
    deletedText: {
        fontSize: 14,
        fontStyle: 'italic',
        color: Colors.textMuted,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 4,
    },
    time: {
        fontSize: 11,
        color: Colors.textMuted,
    },
    ownMeta: {
        color: 'rgba(255,255,255,0.7)',
    },
    edited: {
        fontSize: 11,
        color: Colors.textMuted,
        fontStyle: 'italic',
    },
});

export default MessageItem;
