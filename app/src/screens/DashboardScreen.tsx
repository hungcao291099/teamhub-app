import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '../config/theme';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axiosClient from '../api/axiosClient';
import Card from '../components/Card';
import { Calendar, Repeat, Wallet } from 'lucide-react-native';

const DashboardScreen = () => {
    const { user } = useAuth();
    const { subscribe } = useSocket();
    const [stats, setStats] = useState({
        eventsCount: 0,
        balance: 0,
        currentDuty: 'Loading...'
    });
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async () => {
        try {
            const [events, fundSummary, duty] = await Promise.all([
                axiosClient.get('/events'),
                axiosClient.get('/funds/summary'),
                axiosClient.get('/duty')
            ]);

            setStats({
                eventsCount: Array.isArray(events) ? events.length : 0,
                balance: (fundSummary as any)?.currentBalance || 0,
                currentDuty: (() => {
                    const d = duty as any;
                    if (d?.members && d.members.length > 0) {
                        return d.members[d.currentIndex]?.name || 'Chưa rõ';
                    }
                    return 'Chưa rõ';
                })()
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();

        // Subscribe to socket events for real-time updates
        const unsubEvents = subscribe('events:updated', () => {
            console.log('[Dashboard] Events updated via socket');
            fetchStats();
        });
        const unsubFunds = subscribe('fund:updated', () => {
            console.log('[Dashboard] Fund updated via socket');
            fetchStats();
        });
        const unsubDuty = subscribe('duty:updated', () => {
            console.log('[Dashboard] Duty updated via socket');
            fetchStats();
        });

        return () => {
            unsubEvents();
            unsubFunds();
            unsubDuty();
        };
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.welcome}>
                    <Text style={styles.greeting}>Xin chào,</Text>
                    <Text style={styles.name}>{user?.name} 👋</Text>
                </View>

                <View style={styles.statsGrid}>
                    <Card style={styles.statCard}>
                        <View style={[styles.iconBox, { backgroundColor: '#E1F5FE' }]}>
                            <Calendar color="#0288D1" size={24} />
                        </View>
                        <Text style={styles.statValue}>{stats.eventsCount}</Text>
                        <Text style={styles.statLabel}>Sự kiện sắp tới</Text>
                    </Card>

                    <Card style={styles.statCard}>
                        <View style={[styles.iconBox, { backgroundColor: '#E8F5E9' }]}>
                            <Wallet color="#2E7D32" size={24} />
                        </View>
                        <Text style={styles.statValue}>{formatCurrency(stats.balance)}</Text>
                        <Text style={styles.statLabel}>Số dư quỹ</Text>
                    </Card>
                </View>

                <Card style={styles.dutyCard}>
                    <View style={styles.dutyHeader}>
                        <View style={[styles.iconBox, { backgroundColor: '#FFF3E0' }]}>
                            <Repeat color="#EF6C00" size={24} />
                        </View>
                        <View style={styles.dutyText}>
                            <Text style={styles.statLabel}>Đang trực hôm nay</Text>
                            <Text style={styles.dutyName}>{stats.currentDuty}</Text>
                        </View>
                    </View>
                </Card>

                {/* Placeholder for more dashboard elements */}
                <View style={styles.noticeSection}>
                    <Text style={styles.sectionTitle}>Thông báo mới</Text>
                    <Text style={styles.emptyText}>Hiện chưa có thông báo nào mới cho bạn.</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        padding: Spacing.md,
    },
    welcome: {
        marginBottom: Spacing.xl,
        marginTop: Spacing.md,
    },
    greeting: {
        fontSize: 16,
        color: Colors.textMuted,
        fontWeight: '500',
    },
    name: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.text,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.md,
    },
    statCard: {
        flex: 1,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: Radius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
        marginVertical: 4,
    },
    statLabel: {
        fontSize: 13,
        color: Colors.textMuted,
        fontWeight: '500',
    },
    dutyCard: {
        marginBottom: Spacing.xl,
    },
    dutyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    dutyText: {
        flex: 1,
    },
    dutyName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
    },
    noticeSection: {
        marginTop: Spacing.sm,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: Spacing.md,
    },
    emptyText: {
        textAlign: 'center',
        color: Colors.textMuted,
        marginTop: Spacing.lg,
        fontStyle: 'italic',
    }
});

export default DashboardScreen;
