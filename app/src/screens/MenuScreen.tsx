import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '../config/theme';
import { Calendar, Repeat, BookOpen, ChevronRight, MessageCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

interface MenuItem {
    title: string;
    subtitle: string;
    icon: any;
    screen: string;
    color: string;
}

const menuItems: MenuItem[] = [
    {
        title: 'Nhắn tin',
        subtitle: 'Trò chuyện với đồng đội',
        icon: MessageCircle,
        screen: 'ChatList',
        color: '#5865F2',
    },
    {
        title: 'Lịch tiệc',
        subtitle: 'Xem các sự kiện sắp tới',
        icon: Calendar,
        screen: 'Events',
        color: '#43B581',
    },
    {
        title: 'Trực nhật',
        subtitle: 'Thứ tự xoay tua trực nhật',
        icon: Repeat,
        screen: 'Duties',
        color: '#EF6C00',
    },
    {
        title: 'Sổ quỹ',
        subtitle: 'Quản lý thu chi đội',
        icon: BookOpen,
        screen: 'Funds',
        color: '#2E7D32',
    },
];

const MenuScreen = () => {
    const navigation = useNavigation<any>();

    const handlePress = (screen: string) => {
        navigation.navigate(screen);
    };

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.header}>Chức năng</Text>
                <Text style={styles.subHeader}>Chọn tính năng bạn muốn sử dụng</Text>

                <View style={styles.menuList}>
                    {menuItems.map((item, index) => {
                        const IconComponent = item.icon;
                        return (
                            <TouchableOpacity
                                key={index}
                                style={styles.menuItem}
                                onPress={() => handlePress(item.screen)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                                    <IconComponent size={24} color={item.color} />
                                </View>
                                <View style={styles.menuContent}>
                                    <Text style={styles.menuTitle}>{item.title}</Text>
                                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                                </View>
                                <ChevronRight size={20} color={Colors.textMuted} />
                            </TouchableOpacity>
                        );
                    })}
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
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.text,
        marginTop: Spacing.md,
    },
    subHeader: {
        fontSize: 15,
        color: Colors.textMuted,
        marginTop: 4,
        marginBottom: Spacing.xl,
    },
    menuList: {
        gap: Spacing.sm,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.card,
        padding: Spacing.md,
        borderRadius: Radius.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: Radius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    menuContent: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: Colors.text,
    },
    menuSubtitle: {
        fontSize: 13,
        color: Colors.textMuted,
        marginTop: 2,
    },
});

export default MenuScreen;
