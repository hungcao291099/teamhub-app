import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors, Radius, Spacing } from '../config/theme';

interface ButtonProps {
    onPress: () => void;
    title: string;
    variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
}

const Button: React.FC<ButtonProps> = ({
    onPress,
    title,
    variant = 'primary',
    loading = false,
    disabled = false,
    style
}) => {
    const getButtonStyle = (): ViewStyle => {
        switch (variant) {
            case 'secondary': return { backgroundColor: Colors.secondary };
            case 'ghost': return { backgroundColor: 'transparent' };
            case 'destructive': return { backgroundColor: Colors.destructive };
            default: return { backgroundColor: Colors.primary };
        }
    };

    const getTextStyle = (): TextStyle => {
        switch (variant) {
            case 'secondary': return { color: Colors.text };
            case 'ghost': return { color: Colors.primary };
            default: return { color: Colors.white };
        }
    };

    return (
        <TouchableOpacity
            style={[styles.button, getButtonStyle(), style, (disabled || loading) && styles.disabled]}
            onPress={onPress}
            disabled={disabled || loading}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'secondary' || variant === 'ghost' ? Colors.primary : Colors.white} />
            ) : (
                <Text style={[styles.text, getTextStyle()]}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        height: 48,
        borderRadius: Radius.md,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
    },
    disabled: {
        opacity: 0.6,
    },
});

export default Button;
