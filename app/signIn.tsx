
import React, { useState, useEffect } from 'react';

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
    Image,
    Animated,
    useWindowDimensions,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import {
    loginAccount,
    saveUserSession
} from '../database/account';

type LayoutBox = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export default function SignIn() {
    const db = useSQLiteContext();
    const { width, height } = useWindowDimensions();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Actual layout measurements
    const [canvasLayout, setCanvasLayout] = useState<LayoutBox | null>(null);
    const [cardLayout, setCardLayout] = useState<LayoutBox | null>(null);
    const [logoLayout, setLogoLayout] = useState<LayoutBox | null>(null);

    const [animationStarted, setAnimationStarted] = useState(false);
    const [animationFinished, setAnimationFinished] = useState(false);

    const fish = require('../assets/fish.jpg');
    const fishLogo = require('../assets/fishLogo.png');

    // Animated values
    const [overlayX] = useState(() => new Animated.Value(0));
    const [overlayY] = useState(() => new Animated.Value(0));
    const [overlayWidth] = useState(() => new Animated.Value(0));
    const [overlayHeight] = useState(() => new Animated.Value(0));
    const [overlayRadius] = useState(() => new Animated.Value(0));
    const [overlayOpacity] = useState(() => new Animated.Value(1));

    const [logoX] = useState(() => new Animated.Value(0));
    const [logoY] = useState(() => new Animated.Value(0));
    const [logoWidth] = useState(() => new Animated.Value(90));
    const [logoHeight] = useState(() => new Animated.Value(90));
    const [centerLogoOpacity] = useState(() => new Animated.Value(1));

    const [cardLogoOpacity] = useState(() => new Animated.Value(0));
    const [contentOpacity] = useState(() => new Animated.Value(0));

    // Change the overlay from solid white to the card's translucent white.
    const overlayColor = overlayRadius.interpolate({
        inputRange: [0, 20],
        outputRange: [
            'rgba(255,255,255,1)',
            'rgba(255,255,255,0.75)',
        ],
    });

    // Start animation only after the canvas, card, and logo are measured.
    useEffect(() => {
        if (
            !canvasLayout ||
            !cardLayout ||
            !logoLayout ||
            animationStarted
        ) {
            return;
        }

        setAnimationStarted(true);

        const centerLogoSize = 90;

        // Starting position: center of the available screen canvas.
        const startLogoX = (canvasLayout.width - centerLogoSize) / 2;
        const startLogoY = (canvasLayout.height - centerLogoSize) / 2;

        // Destination: actual logo position inside the actual card.
        const targetLogoX = cardLayout.x + logoLayout.x;
        const targetLogoY = cardLayout.y + logoLayout.y;

        // Starting overlay: entire screen canvas.
        overlayX.setValue(0);
        overlayY.setValue(0);
        overlayWidth.setValue(canvasLayout.width);
        overlayHeight.setValue(canvasLayout.height);
        overlayRadius.setValue(0);

        logoX.setValue(startLogoX);
        logoY.setValue(startLogoY);
        logoWidth.setValue(centerLogoSize);
        logoHeight.setValue(centerLogoSize);

        Animated.sequence([
            Animated.delay(400),

            // Move the overlay and logo independently.
            Animated.parallel([
                Animated.timing(overlayX, {
                    toValue: cardLayout.x,
                    duration: 1000,
                    useNativeDriver: false,
                }),

                Animated.timing(overlayY, {
                    toValue: cardLayout.y,
                    duration: 1000,
                    useNativeDriver: false,
                }),

                Animated.timing(overlayWidth, {
                    toValue: cardLayout.width,
                    duration: 1000,
                    useNativeDriver: false,
                }),

                Animated.timing(overlayHeight, {
                    toValue: cardLayout.height,
                    duration: 1000,
                    useNativeDriver: false,
                }),

                Animated.timing(overlayRadius, {
                    toValue: 20,
                    duration: 1000,
                    useNativeDriver: false,
                }),

                Animated.timing(logoX, {
                    toValue: targetLogoX,
                    duration: 1000,
                    useNativeDriver: false,
                }),

                Animated.timing(logoY, {
                    toValue: targetLogoY,
                    duration: 1000,
                    useNativeDriver: false,
                }),

                Animated.timing(logoWidth, {
                    toValue: logoLayout.width,
                    duration: 1000,
                    useNativeDriver: false,
                }),

                Animated.timing(logoHeight, {
                    toValue: logoLayout.height,
                    duration: 1000,
                    useNativeDriver: false,
                }),
            ]),

            // Reveal the actual card and its contents.
            Animated.parallel([
                Animated.timing(overlayOpacity, {
                    toValue: 0,
                    duration: 350,
                    useNativeDriver: false,
                }),

                Animated.timing(centerLogoOpacity, {
                    toValue: 0,
                    duration: 350,
                    useNativeDriver: false,
                }),

                Animated.timing(cardLogoOpacity, {
                    toValue: 1,
                    duration: 350,
                    useNativeDriver: false,
                }),

                Animated.timing(contentOpacity, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: false,
                }),
            ]),
        ]).start(() => {
            setAnimationFinished(true);
        });

    }, [
        canvasLayout,
        cardLayout,
        logoLayout,
        animationStarted,
    ]);

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
            keyboardVerticalOffset={0}
        >
            <ImageBackground
                source={fish}
                style={styles.bgimage}
                resizeMode="cover"
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View
                        style={[
                            styles.canvas,
                            { minHeight: height }
                        ]}
                        onLayout={(event) => {
                            setCanvasLayout(event.nativeEvent.layout);
                        }}
                    >
                        {/* SIGN-IN CARD */}
                        <View
                            style={[
                                styles.content,
                                { width: Math.min(width * 0.9, 600) }
                            ]}
                            onLayout={(event) => {
                                setCardLayout(event.nativeEvent.layout);
                            }}
                        >
                            {/* CARD LOGO */}
                            <Animated.Image
                                source={fishLogo}
                                resizeMode="contain"
                                onLayout={(event) => {
                                    setLogoLayout(event.nativeEvent.layout);
                                }}
                                style={[
                                    styles.logos,
                                    { opacity: cardLogoOpacity }
                                ]}
                            />

                            {/* FORM CONTENT */}
                            <Animated.View
                                style={{ opacity: contentOpacity }}
                            >
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

                                    <View style={styles.passwordWrapper}>
                                        <TextInput
                                            style={styles.passwordInput}
                                            placeholder="Enter your password"
                                            placeholderTextColor="#94A3B8"
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry={!showPassword}
                                            editable={!loading}
                                            returnKeyType="done"
                                            onSubmitEditing={handleLogin}
                                        />

                                        <TouchableOpacity
                                            style={styles.eyeButton}
                                            onPress={() =>
                                                setShowPassword(!showPassword)
                                            }
                                            disabled={loading}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons
                                                name={
                                                    showPassword
                                                        ? 'eye-off-outline'
                                                        : 'eye-outline'
                                                }
                                                size={23}
                                                color="#555555"
                                            />
                                        </TouchableOpacity>
                                    </View>

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
                            </Animated.View>
                        </View>

                        {/* ANIMATED WHITE CARD OVERLAY */}
                        {!animationFinished && (
                            <View
                                pointerEvents="none"
                                style={StyleSheet.absoluteFill}
                            >
                                <Animated.View
                                    style={[
                                        styles.animatedOverlay,
                                        {
                                            left: overlayX,
                                            top: overlayY,
                                            width: overlayWidth,
                                            height: overlayHeight,
                                            borderRadius: overlayRadius,
                                            backgroundColor: overlayColor,
                                            opacity: overlayOpacity,
                                        },
                                    ]}
                                />
                                
                                {/* LOGO MOVES INDEPENDENTLY */}
                                <Animated.Image
                                    source={fishLogo}
                                    resizeMode="contain"
                                    style={[
                                        styles.movingLogo,
                                        {
                                            left: logoX,
                                            top: logoY,
                                            width: logoWidth,
                                            height: logoHeight,
                                            opacity: centerLogoOpacity,
                                        },
                                    ]}
                                />
                            </View>
                        )}
                    </View>
                </ScrollView>
            </ImageBackground>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },

    bgimage: {
        flex: 1,
        width: '100%',
    },

    scrollContent: {
        flexGrow: 1,
    },

    canvas: {
        width: '100%',
        flexGrow: 1,
        marginTop: 50
    },

    content: {
        alignSelf: 'center',
        marginTop: 75,
        backgroundColor: 'rgba(255, 255, 255, 0.75)',
        paddingHorizontal: 28,
        paddingVertical: 30,
        borderRadius: 20,
        maxWidth: 600,
    },

    logos: {
        width: 50,
        height: 50,
        alignSelf: 'center',
        marginBottom: 20,
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

    passwordWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        height: 52,
        borderRadius: 10,
        paddingRight: 12,
        marginBottom: 22,
    },

    passwordInput: {
        flex: 1,
        height: '100%',
        paddingHorizontal: 15,
        fontSize: 15,
        color: '#161616',
    },

    eyeButton: {
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
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

    animatedOverlay: {
        position: 'absolute',
        overflow: 'hidden',
    },

    movingLogo: {
        position: 'absolute',
    },
});
