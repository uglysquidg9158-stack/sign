
import React, { useState } from 'react';

import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    ActivityIndicator,
    ImageBackground
} from 'react-native';

import { router } from 'expo-router';


import { registerAccount, validateUsername, validatePassword } from '../database/account';

export default function Signup() {

    const fish = require('../assets/fish.jpg');

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [signupError, setSignupError] = useState('');


    async function handleSignup() {

        if (
            !username.trim() ||
            !email.trim() ||
            !password ||
            !confirmPassword
        ) {
            setSignupError('Please complete all fields.');
            return;
        }

        const usernameError = validateUsername(username);

        if (usernameError) {
            setSignupError(usernameError);
            return;
        }

        const passwordError = validatePassword(password);

        if (passwordError) {
            setSignupError(passwordError);
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setSignupError('Enter a valid email address.');
            return;
        }

        if (password !== confirmPassword) {
            setSignupError('Passwords do not match.');
            return;
        }

        try {

            setSignupError('');
            setLoading(true);

            await registerAccount(username.trim(), email.trim(), username.trim(), password);

            Alert.alert(
                'Registration Successful',
                'Your account has been created. Check your email if verification is enabled.',
                [
                    {
                        text: 'Continue',
                        onPress: () => router.replace('/signIn')
                    }
                ]
            );


        } catch (error: any) {

            console.error('Signup error:', error);

            const code = error?.code || error?.error_code || '';
            const message = String(error?.message || 'Unable to create account.');

            if (code === 'over_email_send_rate_limit' || message.toLowerCase().includes('email rate limit')) {
                setSignupError(
                    'Supabase has reached its built-in email limit (2 emails per hour). No account was created. Wait for the limit to reset, or configure custom SMTP in Supabase to allow signup emails to reach normal Gmail addresses.'
                );
            } else if (code === 'email_address_invalid') {
                setSignupError(
                    'Supabase rejected this address during its email validation check. This is not a missing-field error. Check the exact address and Supabase Auth logs; if a real address is still rejected, contact Supabase support.'
                );
            } else if (code === 'email_address_not_authorized') {
                setSignupError(
                    'Supabase’s default email service only sends to members of your Supabase organization. Configure custom SMTP to send confirmation emails to other addresses.'
                );
            } else {
                setSignupError(message);
            }

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

                  {/*
                  
                    <View style={styles.logo}>
                        <Text style={styles.logoText}>S</Text>
                    </View>
                        */ }

                    <Text style={styles.title}>
                        Create Account
                    </Text>

                    <Text style={styles.subtitle}>
                        Join us and get started today
                    </Text>

                    {signupError ? (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{signupError}</Text>
                        </View>
                    ) : null}

                    <View style={styles.form}>

                        <Text style={styles.label}>Username</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Choose a username"
                            placeholderTextColor="#94A3B8"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!loading}
                        />

                        <Text style={styles.label}>Email</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Enter your email"
                            placeholderTextColor="#94A3B8"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={!loading}
                        />

                        <Text style={styles.label}>Password</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Create a password"
                            placeholderTextColor="#94A3B8"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            editable={!loading}
                        />

                        <Text style={styles.label}>Confirm Password</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Confirm your password"
                            placeholderTextColor="#94A3B8"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            editable={!loading}
                        />


                        <TouchableOpacity
                            style={[
                                styles.signupButton,
                                loading && styles.disabledButton
                            ]}
                            onPress={handleSignup}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.signupButtonText}>
                                    Create Account
                                </Text>
                            )}
                        </TouchableOpacity>

                    </View>

                    <View style={styles.footer}>

                        <Text style={styles.footerText}>
                            Already have an account?
                        </Text>

                        <TouchableOpacity
                            onPress={() => router.replace('/signIn')}
                            disabled={loading}
                        >
                            <Text style={styles.loginText}>
                                {' '}Sign In
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
        backgroundColor: '#e5e5e6',
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
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    paddingHorizontal: 28,
    paddingVertical: 30,
    borderRadius: 20,
    },

    logo: {
        width: 60,
        height: 60,
        borderRadius: 20,
        backgroundColor: '#88898b',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 20,
    },

    logoText: {
        color: '#FFFFFF',
        fontSize: 30,
        fontWeight: 'bold',
    },

    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#363636',
        textAlign: 'center',
    },

    subtitle: {
        fontSize: 14,
        color: '#808080',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 30,
    },

    form: {
        width: '100%',
    },

    errorBox: {
        backgroundColor: '#FEE2E2',
        borderColor: '#FCA5A5',
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
    },

    errorText: {
        color: '#991B1B',
        fontSize: 13,
        lineHeight: 19,
    },

    label: {
        color: '#1f2122',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },

    input: {
        backgroundColor: '#FFFFFF',
        height: 52,
        borderRadius: 10,
        paddingHorizontal: 15,
        fontSize: 15,
        marginBottom: 18,
        color: '#101827',
    },

    adminOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        marginTop: 4,
    },

    checkbox: {
        width: 22,
        height: 22,
        borderWidth: 1,
        borderColor: '#82A9FF',
        borderRadius: 5,
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },

    checked: {
        backgroundColor: '#4F80E8',
    },

    checkmark: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },

    adminOptionText: {
        color: '#82A9FF',
        fontWeight: 'bold',
    },

    adminNotice: {
        color: '#AAB6C8',
        fontSize: 12,
        marginVertical: 10,
    },

    signupButton: {
        backgroundColor: '#111111',
        height: 54,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
    },

    disabledButton: {
        opacity: 0.6,
    },

    signupButtonText: {
        color: '#d8d3d3',
        fontSize: 16,
        fontWeight: 'bold',
    },

    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 28,
    },

    footerText: {
        color: '#686869',
        fontSize: 14,
    },

    loginText: {
        color: '#313233',
        fontSize: 14,
        fontWeight: 'bold',
    },
   


});
