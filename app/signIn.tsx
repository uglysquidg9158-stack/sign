
import React, { useState } from 'react';

import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ScrollView,
    ActivityIndicator,
    ImageBackground,
    Image
} from 'react-native';

import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import {
    loginAccount,
    saveUserSession     
} from '../database/account';

export default function SignIn() {
    const db = useSQLiteContext();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const fish = require('../assets/fish.jpg');
    const fishLogo = require('../assets/fishLogo.png');

    async function handleLogin() {
        if (!username.trim() || !password) {
            Alert.alert(
                'Missing Information',
                'Please enter your username and password.'
            );
            return;
        }

        try {
            setLoading(true);

            const result = await loginAccount(
                db,
                username.trim(),
                password
            );

            if (!result.success || !result.account) {
                Alert.alert(
                    'Login Failed',
                    result.message || 'Invalid username or password.'
                );
                return;
            }

            // SAVE LOGGED-IN ACCOUNT ID
            await saveUserSession(db, result.account.id);

            console.log(
                'Logged-in account ID:',
                result.account.id
            );

            // NAVIGATE TO LIST
            router.replace('/tabs/list');

        } catch (error) {
            console.error('Login error:', error);

            Alert.alert(
                'Error',
                'Something went wrong while logging in.'
            );

        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
        <ImageBackground
          source={fish}
           style={styles.bgimage} resizeMode="cover">
           

                <View style={styles.content}>

                    {/**
                     
                    <View style={styles.logo}>
                        <Text style={styles.logoText}>S</Text>
                    </View>
                        */}

                    <Image source={fishLogo} 
                    style={styles.logos} 
                    resizeMode='contain'/>
                    <Text style={styles.title}>
                        Welcome Back
                    </Text>

                    <Text style={styles.subtitle}>
                        Sign in to continue to your account
                    </Text>

                    <View style={styles.form}>

                        <Text style={styles.label}>
                            Username
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Enter your username"
                            placeholderTextColor="#94A3B8"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!loading}
                            returnKeyType="next"
                        />

                        <Text style={styles.label}>
                            Password
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Enter your password"
                            placeholderTextColor="#94A3B8"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            editable={!loading}
                            returnKeyType="done"
                            onSubmitEditing={handleLogin}
                        />

                        <TouchableOpacity
                            style={[
                                styles.loginButton,
                                loading && styles.disabledButton
                            ]}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.loginText}>
                                    Sign In
                                </Text>
                            )}
                        </TouchableOpacity>

                    </View>

                    <View style={styles.footer}>

                        <Text style={styles.footerText}>
                            Don't have an account?
                        </Text>

                        <TouchableOpacity
                            onPress={() => router.push('/signup')}
                            disabled={loading}
                        >
                            <Text style={styles.signupText}>
                                {' '}Sign Up
                            </Text>
                        </TouchableOpacity>

                    </View>

                </View>
             </ImageBackground>
            </ScrollView>

        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#e0e0e0',
    },
    bgimage: {
        flex: 1,
        height: '100%',
        width: '100%',

    },

    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },

    content: {
    marginTop: 75,
    width: '90%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    paddingHorizontal: 28,
    paddingVertical: 30,
    borderRadius: 20,
    },
    logo: {
        width: 65,
        height: 65,
        borderRadius: 20,
        backgroundColor: '#666666',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 25,
    },

    logoText: {
        color: '#181818',
        fontSize: 32,
        fontWeight: 'bold',
    },

    title: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#252627',
        textAlign: 'center',
    },

    subtitle: {
        fontSize: 14,
        color: '#3e4042',
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 40,
    },

    form: {
        width: '100%',
    },

    label: {
        color: '#434444',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 9,
    },

    input: {
        backgroundColor: '#FFFFFF',
        height: 52,
        borderRadius: 10,
        paddingHorizontal: 15,
        fontSize: 15,
        marginBottom: 22,
        color: '#161616',
    },

    loginButton: {
        backgroundColor: '#141414',
        height: 54,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
    },

    disabledButton: {
        opacity: 0.6,
    },

    loginText: {
        color: '#cfcdcd',
        fontSize: 16,
        fontWeight: 'bold',
    },

    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30,
    },

    footerText: {
        color: '#6c6c6d',
        fontSize: 14,
    },

    signupText: {
        color: '#262627',
        fontSize: 14,
        fontWeight: 'bold',
    },
    logos: {
        height: 50,
        width: 50,
        alignSelf: 'center'
    }

});
