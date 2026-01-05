import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import axiosClient from '../api/axiosClient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '../config/theme';
import { useSocket } from '../context/SocketContext';
import Card from '../components/Card';
import { Calendar as CalendarIcon, MapPin, Clock } from 'lucide-react-native';

interface Event {
    id: number;
    title: string;
    description: string;
    eventTimestamp: string;
    location: string;
    createdAt: string;
}

const EventsScreen = () => {
    const { subscribe } = useSocket();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchEvents = async () => {
        try {
            const data = await axiosClient.get('/events');
            if (Array.isArray(data)) {
                setEvents(data);
            }
        } catch (error) {
            console.error("Error fetching events:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchEvents();

        // Subscribe to socket events for real-time updates
        const unsub = subscribe('events:updated', () => {
            console.log('[Events] Updated via socket');
            fetchEvents();
        });

        return () => unsub();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchEvents();
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderItem = ({ item }: { item: Event }) => {
        return (
            <Card style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={[styles.badge, { backgroundColor: Colors.primary + '20' }]}>
                        <Text style={[styles.badgeText, { color: Colors.primary }]}>
                            Sự kiện
                        </Text>
                    </View>
                    <Text style={styles.dateText}>{formatDate(item.eventTimestamp)}</Text>
                </View>

                <Text style={styles.title}>{item.title}</Text>

                <View style={styles.infoRow}>
                    <Clock size={14} color={Colors.textMuted} />
                    <Text style={styles.infoText}>{formatTime(item.eventTimestamp)}</Text>
                </View>

                {item.location && (
                    <View style={styles.infoRow}>
                        <MapPin size={14} color={Colors.textMuted} />
                        <Text style={styles.infoText}>{item.location}</Text>
                    </View>
                )}

                {item.description && (
                    <View style={styles.descriptionBox}>
                        <Text style={styles.description}>{item.description}</Text>
                    </View>
                )}
            </Card>
        );
    };

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
                data={events}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <CalendarIcon size={48} color={Colors.textMuted} style={{ marginBottom: 12 }} />
                        <Text style={styles.empty}>Không có sự kiện nào sắp tới.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    list: {
        padding: Spacing.md
    },
    card: {
        marginBottom: Spacing.md,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: Radius.sm,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    dateText: {
        fontSize: 13,
        color: Colors.textMuted,
        fontWeight: '600'
    },
    title: {
        fontSize: 19,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    infoText: {
        fontSize: 14,
        color: Colors.textMuted,
    },
    descriptionBox: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    description: {
        fontSize: 14,
        color: Colors.text,
        lineHeight: 20
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60
    },
    empty: {
        color: Colors.textMuted,
        fontSize: 16,
    }
});

export default EventsScreen;
