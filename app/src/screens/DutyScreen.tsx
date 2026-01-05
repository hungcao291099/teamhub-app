import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, RefreshControl, ScrollView, ActivityIndicator } from 'react-native';
import axiosClient from '../api/axiosClient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '../config/theme';
import { useSocket } from '../context/SocketContext';
import Card from '../components/Card';
import { User as UserIcon, Star } from 'lucide-react-native';

interface Member {
    id: number;
    username: string;
    name: string;
    role: string;
}

interface DutyData {
    id: number;
    currentIndex: number;
    memberOrder: string[];
    members: Member[];
}

const DutyScreen = () => {
    const { subscribe } = useSocket();
    const [data, setData] = useState<DutyData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            const res = await axiosClient.get('/duty');
            setData(res as any);
        } catch (error) {
            console.error("Error fetching duty:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Subscribe to socket events for real-time updates
        const unsub = subscribe('duty:updated', () => {
            console.log('[Duty] Updated via socket');
            fetchData();
        });

        return () => unsub();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    // Get current turn user from members array using currentIndex
    const currentTurnUser = data?.members && data.members.length > 0
        ? data.members[data.currentIndex]
        : null;

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            >
                {data && data.members && data.members.length > 0 ? (
                    <>
                        <Card style={styles.activeCard}>
                            <View style={styles.activeIconBox}>
                                <Star color={Colors.white} size={32} fill={Colors.white} />
                            </View>
                            <Text style={styles.label}>ĐANG TRỰC</Text>
                            <Text style={styles.currentName}>{currentTurnUser?.name || 'Chưa rõ'}</Text>
                            <Text style={styles.username}>@{currentTurnUser?.username}</Text>
                        </Card>

                        <Text style={styles.sectionTitle}>Thứ tự xoay tua</Text>
                        {data.members.map((user: Member, index: number) => {
                            const isCurrent = index === data.currentIndex;
                            return (
                                <View key={user.id} style={[styles.userRow, isCurrent && styles.activeRow]}>
                                    <View style={[styles.avatar, isCurrent && { backgroundColor: Colors.primary }]}>
                                        <Text style={[styles.avatarText, isCurrent && { color: Colors.white }]}>
                                            {user.name.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={styles.userInfo}>
                                        <Text style={[styles.userName, isCurrent && styles.activeName]}>
                                            {user.name}
                                        </Text>
                                        <Text style={styles.userRole}>Thành viên đội</Text>
                                    </View>
                                    {isCurrent && (
                                        <View style={styles.statusBadge}>
                                            <Text style={styles.statusText}>Hiện tại</Text>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </>
                ) : (
                    <View style={styles.emptyContainer}>
                        <UserIcon size={48} color={Colors.textMuted} />
                        <Text style={styles.empty}>Chưa có danh sách trực nhật.</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { padding: Spacing.md },
    activeCard: {
        backgroundColor: Colors.primary,
        alignItems: 'center',
        paddingVertical: 32,
        marginBottom: 24,
    },
    activeIconBox: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    label: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '900', letterSpacing: 1 },
    currentName: { fontSize: 32, fontWeight: 'bold', color: Colors.white, marginTop: 4 },
    username: { fontSize: 16, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: Colors.text },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.card,
        padding: 12,
        marginBottom: 8,
        borderRadius: Radius.md,
    },
    activeRow: {
        borderWidth: 1,
        borderColor: Colors.primary,
        backgroundColor: Colors.secondary,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    activeName: {
        color: Colors.primary,
    },
    userRole: {
        fontSize: 12,
        color: Colors.textMuted,
    },
    statusBadge: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: Radius.sm,
    },
    statusText: {
        color: Colors.white,
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60
    },
    empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 12 },
});

export default DutyScreen;
