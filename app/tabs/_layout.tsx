
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: '#000000',
                tabBarInactiveTintColor: '#555555',
                tabBarLabelStyle: styles.tabLabel,
            }}
        >
            <Tabs.Screen
                name="list"
                options={{
                    title: 'List',
                    tabBarIcon: ({ focused, size }) => (
                        <Ionicons
                            name="people-outline"
                            size={size}
                            color={focused ? '#000000' : '#575757'}
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ focused, size }) => (
                        <Ionicons
                            name="person-outline"
                            size={size}
                            color={focused ? '#000000' : '#575757'}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: '#b4b4b4',
        borderTopColor: '#334155',
        borderTopWidth: 1,
        height: 65,
        paddingBottom: 8,
        paddingTop: 8,
    },

    tabLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
});
