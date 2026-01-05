import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, Radius } from '../../config/theme';
import { useSocket } from '../../context/SocketContext';
import { chatService, Conversation } from '../../services/chatService';
import { MessageCircle, Users } from 'lucide-react-native';

const ChatListScreen = () => {
    const navigation = useNavigation<any>();
    const { subscribe } = useSocket();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchConversations = async () => {
        try {
            const data = await chatService.getConversations();
            setConversations(data);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchConversations();
        }, [])
    );

    useEffect(() => {
        // Subscribe to socket events - server emits 'chat:message'
        const unsubNewMsg = subscribe('chat:message', () => {
            console.log('[ChatList] New message received via socket');
            fetchConversations();
        });

        return () => {
            unsubNewMsg();
        };
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchConversations();
    };

    const getDisplayName = (conv: Conversation) => {
        if (conv.type === 'group') {
            return conv.name || 'Unnamed Group';
        }
        // For direct chats, use first participant (the other person)
        const otherPerson = conv.participants?.[0];
        return otherPerson?.name || otherPerson?.username || 'Unknown';
    };

    const getAvatarLetter = (conv: Conversation) => {
        const name = getDisplayName(conv);
        return name.charAt(0).toUpperCase();
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Hôm qua';
        } else if (diffDays < 7) {
            return date.toLocaleDateString('vi-VN', { weekday: 'short' });
        }
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    };

    const renderItem = ({ item }: { item: Conversation }) => {
        const hasUnread = (item.unreadCount || 0) > 0;

        return (
            <TouchableOpacity
                style={styles.conversationItem}
                onPress={() => navigation.navigate('ChatRoom', { conversation: item })}
                activeOpacity={0.7}
            >
                <View style={[styles.avatar, item.type === 'group' && styles.groupAvatar]}>
                    {item.type === 'group' ? (
                        <Users size={20} color={Colors.white} />
                    ) : (
                        <Text style={styles.avatarText}>{getAvatarLetter(item)}</Text>
                    )}
                </View>

                <View style={styles.contentBox}>
                    <View style={styles.topRow}>
                        <Text style={[styles.name, hasUnread && styles.unreadName]} numberOfLines={1}>
                            {getDisplayName(item)}
                        </Text>
                        {item.lastMessage && (
                            <Text style={styles.time}>{formatTime(item.lastMessage.createdAt)}</Text>
                        )}
                    </View>

                    <View style={styles.bottomRow}>
                        <Text
                            style={[styles.preview, hasUnread && styles.unreadPreview]}
                            numberOfLines={1}
                        >
                            {item.lastMessage?.isDeleted
                                ? 'Tin nhắn đã xóa'
                                : item.lastMessage?.content || 'Chưa có tin nhắn'}
                        </Text>

                        {hasUnread && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>
                                    {item.unreadCount! > 99 ? '99+' : item.unreadCount}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <FlatList
                data={conversations}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MessageCircle size={48} color={Colors.textMuted} />
                        <Text style={styles.emptyText}>Chưa có cuộc trò chuyện nào</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    list: {
        paddingVertical: Spacing.sm,
    },
    conversationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    groupAvatar: {
        backgroundColor: Colors.success,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.white,
    },
    contentBox: {
        flex: 1,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        flex: 1,
        marginRight: Spacing.sm,
    },
    unreadName: {
        fontWeight: 'bold',
    },
    time: {
        fontSize: 12,
        color: Colors.textMuted,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    preview: {
        fontSize: 14,
        color: Colors.textMuted,
        flex: 1,
        marginRight: Spacing.sm,
    },
    unreadPreview: {
        color: Colors.text,
        fontWeight: '500',
    },
    badge: {
        backgroundColor: Colors.primary,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: Colors.white,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 80,
    },
    emptyText: {
        color: Colors.textMuted,
        fontSize: 16,
        marginTop: Spacing.md,
    },
});

export default ChatListScreen;
