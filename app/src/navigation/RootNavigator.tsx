import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import EventsScreen from '../screens/EventsScreen';
import FundsScreen from '../screens/FundsScreen';
import DutyScreen from '../screens/DutyScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MenuScreen from '../screens/MenuScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';
import ChatRoomScreen from '../screens/chat/ChatRoomScreen';
import { Home, Menu, User } from 'lucide-react-native';
import { Colors } from '../config/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const MenuStack = createNativeStackNavigator();

// Stack navigator for Menu section (contains feature screens)
const MenuStackNavigator = () => {
    return (
        <MenuStack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: Colors.card },
                headerTitleStyle: { fontWeight: 'bold', color: Colors.text },
                headerTintColor: Colors.text,
            }}
        >
            <MenuStack.Screen
                name="MenuHome"
                component={MenuScreen}
                options={{ title: 'Menu' }}
            />
            <MenuStack.Screen
                name="ChatList"
                component={ChatListScreen}
                options={{ title: 'Nhắn tin' }}
            />
            <MenuStack.Screen
                name="ChatRoom"
                component={ChatRoomScreen}
                options={{ title: 'Chat' }}
            />
            <MenuStack.Screen
                name="Events"
                component={EventsScreen}
                options={{ title: 'Lịch tiệc' }}
            />
            <MenuStack.Screen
                name="Duties"
                component={DutyScreen}
                options={{ title: 'Trực nhật' }}
            />
            <MenuStack.Screen
                name="Funds"
                component={FundsScreen}
                options={{ title: 'Sổ quỹ' }}
            />
        </MenuStack.Navigator>
    );
};

const AppTabs = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: true,
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textMuted,
                tabBarStyle: {
                    backgroundColor: Colors.card,
                    borderTopWidth: 0,
                    elevation: 10,
                    shadowOpacity: 0.1,
                    height: 60,
                    paddingBottom: 8,
                },
                headerStyle: {
                    backgroundColor: Colors.card,
                },
                headerTitleStyle: {
                    fontWeight: 'bold',
                    color: Colors.text,
                }
            }}
        >
            <Tab.Screen
                name="Home"
                component={DashboardScreen}
                options={{
                    title: 'Trang chủ',
                    tabBarIcon: ({ color, size }) => <Home color={color} size={size} />
                }}
            />
            <Tab.Screen
                name="Menu"
                component={MenuStackNavigator}
                options={{
                    title: 'Menu',
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => <Menu color={color} size={size} />
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    title: 'Cá nhân',
                    tabBarIcon: ({ color, size }) => <User color={color} size={size} />
                }}
            />
        </Tab.Navigator>
    );
};

export const RootNavigator = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return null;
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {user ? (
                <Stack.Screen name="App" component={AppTabs} />
            ) : (
                <Stack.Screen name="Login" component={LoginScreen} />
            )}
        </Stack.Navigator>
    );
};
