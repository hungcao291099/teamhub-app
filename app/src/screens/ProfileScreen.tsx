import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '../config/theme';
import Card from '../components/Card';
import Button from '../components/Button';
import { LogOut, User, ShieldCheck } from 'lucide-react-native';

const ProfileScreen = () => {
    const { user, logout } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [loading, setLoading] = useState(false);

    const handleUpdate = async () => {
        if (!name.trim()) {
            Alert.alert('Lỗi', 'Tên không được để trống');
            return;
        }
        setLoading(true);
        try {
            await axiosClient.put(`/users/${user.id}`, { name });
            Alert.alert('Thành công', 'Đã cập nhật thông tin cá nhân');
        } catch (error) {
            console.error(error);
            Alert.alert('Lỗi', 'Không thể cập nhật thông tin');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất không?', [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Đăng xuất', style: 'destructive', onPress: logout }
        ]);
    };

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <View style={styles.avatarLarge}>
                        <Text style={styles.avatarLargeText}>
                            {user?.name?.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <Text style={styles.displayName}>{user?.name}</Text>
                    <View style={styles.roleBadge}>
                        <ShieldCheck size={14} color={Colors.primary} />
                        <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
                    </View>
                </View>

                <Card style={styles.formCard}>
                    <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Tên hiển thị</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Nhập tên của bạn"
                            placeholderTextColor={Colors.textMuted}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Tên đăng nhập</Text>
                        <TextInput
                            style={[styles.input, styles.disabledInput]}
                            value={user?.username}
                            editable={false}
                        />
                    </View>

                    <Button
                        title="Lưu thay đổi"
                        onPress={handleUpdate}
                        loading={loading}
                        style={styles.saveBtn}
                    />
                </Card>

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <LogOut size={20} color={Colors.destructive} />
                    <Text style={styles.logoutText}>Đăng xuất tài khoản</Text>
                </TouchableOpacity>

                <View style={styles.appInfo}>
                    <Text style={styles.appInfoText}>TeamHub Mobile v1.0.0</Text>
                    <Text style={styles.appInfoText}>Built with Expo & React Native</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { padding: Spacing.md },
    header: { alignItems: 'center', marginBottom: 24, marginTop: Spacing.lg },
    avatarLarge: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarLargeText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: Colors.white,
    },
    displayName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text,
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.secondary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: Radius.xl,
        marginTop: 8,
    },
    roleText: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.primary,
    },
    formCard: {
        padding: Spacing.lg,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.textMuted,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    input: {
        height: 50,
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radius.md,
        paddingHorizontal: 16,
        fontSize: 16,
        color: Colors.text,
    },
    disabledInput: {
        opacity: 0.6,
        backgroundColor: Colors.secondary,
    },
    saveBtn: {
        marginTop: 8,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        marginTop: 24,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.destructive,
    },
    appInfo: {
        marginTop: 40,
        alignItems: 'center',
        paddingBottom: 40,
    },
    appInfoText: {
        fontSize: 12,
        color: Colors.textMuted,
        marginBottom: 4,
    }
});

export default ProfileScreen;
