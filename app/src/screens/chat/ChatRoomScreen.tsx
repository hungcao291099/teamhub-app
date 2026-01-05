import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Colors, Spacing } from '../../config/theme';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { chatService, Conversation, Message } from '../../services/chatService';
import MessageItem from '../../components/chat/MessageItem';
import ChatInput from '../../components/chat/ChatInput';

type ChatRoomParams = {
    ChatRoom: {
        conversation: Conversation;
    };
};

const ChatRoomScreen = () => {
    const route = useRoute<RouteProp<ChatRoomParams, 'ChatRoom'>>();
    const navigation = useNavigation();
    const { subscribe, emit } = useSocket();
    const { user } = useAuth();

    const { conversation } = route.params;
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    // Set header title
    useEffect(() => {
        const title = conversation.type === 'group'
            ? conversation.name || 'Group Chat'
            : conversation.otherParticipant?.name || 'Chat';
        navigation.setOptions({ title });
    }, [conversation]);

    const fetchMessages = useCallback(async () => {
        try {
            const response = await chatService.getMessages(conversation.id);
            // API returns { messages: [...], total, page, hasMore }
            const messagesArray = (response as any).messages || response;
            if (Array.isArray(messagesArray)) {
                setMessages(messagesArray); // Already oldest first from server
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    }, [conversation.id]);

    useEffect(() => {
        fetchMessages();

        // Join conversation room
        emit('chat:join', conversation.id);

        // Subscribe to new messages - server emits 'chat:message'
        const unsubNewMsg = subscribe('chat:message', (data: any) => {
            console.log('[ChatRoom] Received message via socket:', data.id);
            if (data.conversationId === conversation.id) {
                setMessages(prev => [...prev, data]);
                // Mark as read
                chatService.markAsRead(conversation.id, data.id).catch(() => { });
            }
        });

        const unsubEdit = subscribe('chat:message_edited', (data: any) => {
            if (data.conversationId === conversation.id) {
                setMessages(prev => prev.map(m => m.id === data.id ? { ...m, ...data } : m));
            }
        });

        const unsubDelete = subscribe('chat:message_deleted', (data: any) => {
            if (data.conversationId === conversation.id) {
                setMessages(prev => prev.map(m => m.id === data.id ? { ...m, isDeleted: true } : m));
            }
        });

        return () => {
            emit('chat:leave', conversation.id);
            unsubNewMsg();
            unsubEdit();
            unsubDelete();
        };
    }, [conversation.id]);

    const handleSend = async (content: string) => {
        if (sending) return;

        setSending(true);
        try {
            const newMessage = await chatService.sendMessage(conversation.id, content);
            // Message will be added via socket event
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const shouldShowSender = (message: Message, index: number) => {
        if (message.senderId === user?.id) return false;
        if (index === 0) return true;
        const prevMessage = messages[index - 1];
        return prevMessage.senderId !== message.senderId;
    };

    const renderItem = ({ item, index }: { item: Message; index: number }) => (
        <MessageItem message={item} showSender={shouldShowSender(item, index)} />
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.messageList}
                onContentSizeChange={() => {
                    flatListRef.current?.scrollToEnd({ animated: false });
                }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Chưa có tin nhắn nào</Text>
                        <Text style={styles.emptySubtext}>Hãy bắt đầu cuộc trò chuyện!</Text>
                    </View>
                }
            />
            <ChatInput onSend={handleSend} disabled={sending} />
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
    messageList: {
        paddingVertical: Spacing.md,
        flexGrow: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 16,
        color: Colors.textMuted,
    },
    emptySubtext: {
        fontSize: 14,
        color: Colors.textMuted,
        marginTop: 4,
    },
});

export default ChatRoomScreen;
