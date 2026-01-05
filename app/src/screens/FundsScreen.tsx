import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import axiosClient from '../api/axiosClient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '../config/theme';
import { useSocket } from '../context/SocketContext';
import Card from '../components/Card';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';

interface Transaction {
    id: number;
    amount: number;
    type: 'thu' | 'chi';  // API uses 'thu' (income) / 'chi' (expense)
    description: string;
    timestamp: string;  // API uses timestamp, not date
    balanceAfter: number;
}

interface Summary {
    currentBalance: number;  // API only returns currentBalance
}

const FundsScreen = () => {
    const { subscribe } = useSocket();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            const [txRes, sumRes] = await Promise.all([
                axiosClient.get('/funds'),
                axiosClient.get('/funds/summary')
            ]);
            setTransactions(txRes as any);
            setSummary(sumRes as any);
        } catch (error) {
            console.error("Error fetching funds:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Subscribe to socket events for real-time updates
        const unsub = subscribe('fund:updated', () => {
            console.log('[Funds] Updated via socket');
            fetchData();
        });

        return () => unsub();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // Calculate totals from transactions
    const totalIncome = transactions
        .filter(t => t.type === 'thu')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = transactions
        .filter(t => t.type === 'chi')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const renderHeader = () => (
        <View style={styles.header}>
            <Card style={styles.summaryCard}>
                <Text style={styles.balanceLabel}>Số dư hiện tại</Text>
                <Text style={styles.balanceValue}>{summary ? formatCurrency(summary.currentBalance) : '...'}</Text>

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <View style={[styles.smallIcon, { backgroundColor: '#E8F5E9' }]}>
                            <ArrowUpRight size={16} color="#2E7D32" />
                        </View>
                        <View>
                            <Text style={styles.statLabel}>Thu vào</Text>
                            <Text style={styles.statValueGreen}>+{formatCurrency(totalIncome)}</Text>
                        </View>
                    </View>

                    <View style={styles.statItem}>
                        <View style={[styles.smallIcon, { backgroundColor: '#FFEBEE' }]}>
                            <ArrowDownLeft size={16} color="#C62828" />
                        </View>
                        <View>
                            <Text style={styles.statLabel}>Chi ra</Text>
                            <Text style={styles.statValueRed}>-{formatCurrency(totalExpense)}</Text>
                        </View>
                    </View>
                </View>
            </Card>
            <Text style={styles.sectionTitle}>Lịch sử giao dịch</Text>
        </View>
    );

    const renderItem = ({ item }: { item: Transaction }) => (
        <View style={styles.txRow}>
            <View style={[styles.txIcon, { backgroundColor: item.type === 'thu' ? '#E8F5E9' : '#FFEBEE' }]}>
                {item.type === 'thu' ?
                    <ArrowUpRight size={20} color="#2E7D32" /> :
                    <ArrowDownLeft size={20} color="#C62828" />
                }
            </View>
            <View style={styles.txContent}>
                <Text style={styles.txDesc} numberOfLines={1}>{item.description || 'Không có mô tả'}</Text>
                <Text style={styles.txDate}>{new Date(item.timestamp).toLocaleDateString('vi-VN')}</Text>
            </View>
            <Text style={[styles.txAmount, { color: item.type === 'thu' ? '#3BA55C' : '#ED4245' }]}>
                {item.type === 'thu' ? '+' : '-'}{formatCurrency(Number(item.amount))}
            </Text>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <FlatList
                data={transactions}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl },
    header: {
        paddingTop: Spacing.md,
    },
    summaryCard: {
        backgroundColor: Colors.primary,
        marginBottom: Spacing.xl,
    },
    balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
    balanceValue: { color: Colors.white, fontSize: 32, fontWeight: 'bold', marginVertical: 8 },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: Spacing.md,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    smallIcon: {
        width: 32,
        height: 32,
        borderRadius: Radius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' },
    statValueGreen: { color: '#A5D6A7', fontSize: 14, fontWeight: 'bold' },
    statValueRed: { color: '#EF9A9A', fontSize: 14, fontWeight: 'bold' },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: Spacing.md,
    },
    txRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        backgroundColor: Colors.card,
        paddingHorizontal: Spacing.sm,
        borderRadius: Radius.md,
    },
    txIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    txContent: {
        flex: 1,
    },
    txDesc: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    txDate: {
        fontSize: 12,
        color: Colors.textMuted,
        marginTop: 2,
    },
    txAmount: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    separator: {
        height: 8,
    },
});

export default FundsScreen;
