import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '../config/theme';
import Button from '../components/Button';

const LoginScreen = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ tài khoản và mật khẩu');
            return;
        }

        setIsSubmitting(true);
        try {
            await login(username, password);
        } catch (error: any) {
            console.error(error);
            const status = error.response?.status;
            if (status === 401) {
                Alert.alert('Lỗi đăng nhập', 'Tài khoản hoặc mật khẩu không chính xác');
            } else {
                Alert.alert('Lỗi kết nối', 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra lại IP/VPN.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <Text style={styles.title}>TeamHub</Text>
                            <Text style={styles.subtitle}>Welcome back!</Text>
                        </View>

                        <View style={styles.form}>
                            <Text style={styles.label}>TÀI KHOẢN</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập username..."
                                placeholderTextColor={Colors.textMuted}
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                            />

                            <Text style={styles.label}>MẬT KHẨU</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập mật khẩu..."
                                placeholderTextColor={Colors.textMuted}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />

                            <Button
                                title="Đăng nhập"
                                onPress={handleLogin}
                                loading={isSubmitting}
                                style={styles.submitBtn}
                            />
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>TeamHub v1.0.0</Text>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        flex: 1,
        padding: Spacing.xl,
        justifyContent: 'center',
    },
    header: {
        marginBottom: 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 40,
        fontWeight: '900',
        color: Colors.primary,
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 18,
        color: Colors.textMuted,
        marginTop: 4,
        fontWeight: '500',
    },
    form: {
        backgroundColor: Colors.card,
        padding: Spacing.lg,
        borderRadius: Radius.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    label: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.textMuted,
        marginBottom: 8,
    },
    input: {
        height: 52,
        backgroundColor: Colors.secondary,
        borderRadius: Radius.md,
        paddingHorizontal: 16,
        marginBottom: 20,
        fontSize: 16,
        color: Colors.text,
    },
    submitBtn: {
        marginTop: 10,
    },
    footer: {
        marginTop: 32,
        alignItems: 'center',
    },
    footerText: {
        color: Colors.textMuted,
        fontSize: 12,
    }
});

export default LoginScreen;
