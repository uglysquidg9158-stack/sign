
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { initializeDatabase } from '../database/account';

export default function RootLayout() {
    return (
        <SQLiteProvider
            databaseName="accounts.db"
            onInit={initializeDatabase}
        >
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="signIn" />
                <Stack.Screen name="signup" />
                <Stack.Screen name="tabs" />
            </Stack>
        </SQLiteProvider>
    );
}
