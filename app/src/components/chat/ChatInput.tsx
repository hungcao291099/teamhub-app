import React, { useState, useRef } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Colors, Spacing, Radius } from '../../config/theme';
import { Send } from 'lucide-react-native';

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled = false }) => {
    const [text, setText] = useState('');
    const inputRef = useRef<TextInput>(null);

    const handleSend = () => {
        const trimmed = text.trim();
        if (trimmed && !disabled) {
            onSend(trimmed);
            setText('');
            inputRef.current?.focus();
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={90}
        >
            <View style={styles.container}>
                <View style={styles.inputWrapper}>
                    <TextInput
                        ref={inputRef}
                        style={styles.input}
                        value={text}
                        onChangeText={setText}
                        placeholder="Nhập tin nhắn..."
                        placeholderTextColor={Colors.textMuted}
                        multiline
                        maxLength={2000}
                        editable={!disabled}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.sendButton, (!text.trim() || disabled) && styles.sendButtonDisabled]}
                    onPress={handleSend}
                    disabled={!text.trim() || disabled}
                >
                    <Send size={20} color={text.trim() && !disabled ? Colors.white : Colors.textMuted} />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.card,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    inputWrapper: {
        flex: 1,
        backgroundColor: Colors.secondary,
        borderRadius: Radius.xl,
        paddingHorizontal: Spacing.md,
        paddingVertical: Platform.OS === 'ios' ? Spacing.sm : 0,
        marginRight: Spacing.sm,
        maxHeight: 120,
    },
    input: {
        fontSize: 16,
        color: Colors.text,
        minHeight: 40,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: Colors.secondary,
    },
});

export default ChatInput;
