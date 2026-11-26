
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator
} from 'react-native';

import React, { useEffect, useState } from 'react';

import { router } from 'expo-router';

import { useSQLiteContext } from 'expo-sqlite';

import {
    getLoggedInAccount,
    clearUserSession,
    Account
} from '../../database/account';

export default function Profile() {

    // DATABASE CONNECTION
    const db = useSQLiteContext();

   const [profile, setProfile] = useState<Account | null>(null);
const [loading, setLoading] = useState(true);

async function fetchProfile() {
    try {
        const account = await getLoggedInAccount(db);

        setProfile(account);

        console.log('Logged-in profile:', account);

    } catch (error) {
        console.error('Failed to fetch profile:', error);
        setProfile(null);

    } finally {
        setLoading(false);
    }
}

useEffect(() => {
    fetchProfile();
}, [db]);
    return (

        <ScrollView style={styles.container}>

            <View style={styles.content}>

                <Text style={styles.heading}>My Profile</Text>

                <View style={styles.profileSection}>

                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {profile?.name
                                ? profile.name.charAt(0).toUpperCase()
                                : '?'}
                        </Text>
                    </View>

                    {loading ? (

                        <ActivityIndicator
                            size="large"
                            color="#4F80E8"
                        />

                    ) : profile ? (

                        <>
                            <Text style={styles.username}>
                                {profile.name}
                            </Text>

                            <Text style={styles.email}>
                                {profile.email}
                            </Text>

                            <Text style={styles.email}>
                                @{profile.username}
                            </Text>
                        </>

                    ) : (

                        <Text style={styles.email}>
                            Account information not found.
                        </Text>

                    )}

                   

                </View>

                <View style={styles.divider}/>

                <Text style={styles.sectionTitle}>
                    Account Settings
                </Text>

                <TouchableOpacity style={styles.option}>
                    <Text style={styles.optionIcon}></Text>

                    <Text style={styles.optionText}>
                        Personal Information
                    </Text>

                    <Text style={styles.arrow}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.option}>
                    <Text style={styles.optionIcon}></Text>

                    <Text style={styles.optionText}>
                        Change Password
                    </Text>

                    <Text style={styles.arrow}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.option}>
                    <Text style={styles.optionIcon}></Text>

                    <Text style={styles.optionText}>
                        Notifications
                    </Text>

                    <Text style={styles.arrow}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.option}>
                    <Text style={styles.optionIcon}></Text>

                    <Text style={styles.optionText}>
                        Settings
                    </Text>

                    <Text style={styles.arrow}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={() => router.replace('/signIn')}
                >
                    <Text style={styles.logoutText}>
                        Log Out
                    </Text>
                </TouchableOpacity>

            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#f0efef',
    },

    content: {
        padding: 25,
        paddingTop: 55,
    },

    heading: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#202020',
        marginBottom: 30,
    },

    profileSection: {
        alignItems: 'center',
    },

    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#616161',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },

    avatarText: {
        color: '#141414',
        fontSize: 28,
        fontWeight: 'bold',
    },

    username: {
        color: '#0c0c0c',
        fontSize: 22,
        fontWeight: 'bold',
    },

    email: {
        color: '#585858',
        fontSize: 14,
        marginTop: 5,
    },

    editButton: {
        backgroundColor: '#4F80E8',
        paddingVertical: 11,
        paddingHorizontal: 28,
        borderRadius: 10,
        marginTop: 18,
    },

    editButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },

    divider: {
        height: 1,
        backgroundColor: '#111213',
        marginVertical: 30,
    },

    sectionTitle: {
        color: '#272727',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },

    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#1b1b1b',
    },

    optionIcon: {
        fontSize: 20,
        marginRight: 15,
    },

    optionText: {
        color: '#353434',
        fontSize: 15,
        flex: 1,
    },

    arrow: {
        color: '#AAB6C8',
        fontSize: 25,
    },

    logoutButton: {
        backgroundColor: '#164996',
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 35,
        marginBottom: 25,
    },

    logoutText: {
        color: '#dbdbdb',
        fontSize: 16,
        fontWeight: 'bold',
    },

});
