
import React, { useEffect, useState } from 'react';

import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    Modal,
    Image,
    useWindowDimensions
} from 'react-native';

import { useSQLiteContext } from 'expo-sqlite';

import {
    Account,
    getAccounts,
    addAccount,
    updateAccount,
    removeAccount
} from '../../database/account';

import { useLocalSearchParams } from 'expo-router';

export default function List() {

    const db = useSQLiteContext();
    const { width } = useWindowDimensions();

    const [accounts, setAccounts] = useState<Account[]>([]);
    const [search, setSearch] = useState('');

    const { userId } = useLocalSearchParams<{
        userId: string;
    }>();

    const [modalVisible, setModalVisible] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // TRACK WHICH CARD IS EXPANDED
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const fishy = require('../../assets/fhead.png');

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [accountType, setAccountType] =
        useState<'user' | 'admin'>('user');

    const [loading, setLoading] = useState(true);

    const isAdmin = true;

    async function loadAccounts() {
        try {
            const data = await getAccounts(db);
            setAccounts(data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Could not load accounts.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadAccounts();
    }, [db]);

    function resetForm() {
        setName('');
        setEmail('');
        setUsername('');
        setPassword('');
        setShowPassword(false);
        setAccountType('user');
        setEditingId(null);
    }

    function openAddModal() {
        if (!isAdmin) {
            Alert.alert('Access Denied', 'Admin only.');
            return;
        }

        setExpandedId(null);
        resetForm();
        setModalVisible(true);
    }

    // OPEN EDIT MODAL
    function openEditModal(account: Account) {
        if (!isAdmin) {
            Alert.alert('Access Denied', 'Admin only.');
            return;
        }

        setEditingId(account.id);
        setName(account.name);
        setEmail(account.email);
        setUsername(account.username);
        setAccountType(account.accountType);
        setPassword('');
        setShowPassword(false);

        setModalVisible(true);
    }

    // SAVE ACCOUNT
    async function saveAccount() {

        if (
            !name.trim() ||
            !email.trim() ||
            !username.trim()
        ) {
            Alert.alert('Error', 'Fill in all required fields.');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            Alert.alert('Error', 'Enter a valid email.');
            return;
        }

        try {

            if (editingId !== null) {

                await updateAccount(
                    db,
                    editingId,
                    name.trim(),
                    email.trim(),
                    username.trim()
                );

                Alert.alert('Success', 'Account updated.');

            } else {

                if (!isAdmin) {
                    Alert.alert('Access Denied', 'Admin only.');
                    return;
                }

                if (password.length < 8) {
                    Alert.alert(
                        'Invalid Password',
                        'Password must have at least 8 characters.'
                    );
                    return;
                }

                await addAccount(
                    db,
                    name.trim(),
                    email.trim(),
                    username.trim(),
                    password,
                    accountType
                );

                Alert.alert('Success', 'Account created.');
            }

            setModalVisible(false);
            resetForm();
            await loadAccounts();

        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Could not save account.');
        }
    }

    // DELETE ACCOUNT
    function deleteAccount(id: number) {

        if (!isAdmin) {
            Alert.alert('Access Denied', 'Admin only.');
            return;
        }

        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete this account?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await removeAccount(db, id);
                            setExpandedId(null);
                            await loadAccounts();
                        } catch (error) {
                            Alert.alert('Error', 'Could not delete account.');
                        }
                    }
                }
            ]
        );
    }

    // SEARCH FILTER
    const filteredAccounts = accounts.filter(account =>
        account.name.toLowerCase().includes(search.toLowerCase()) ||
        account.email.toLowerCase().includes(search.toLowerCase()) ||
        account.username.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <View style={styles.container}>

            {/* HEADER AND FISH IMAGE */}
            <View style={styles.headerContainer}>

                <Image
                    source={fishy}
                    style={{
                        position: 'absolute',
                        width: Math.min(width * 0.4, 220),
                        height: Math.min(width * 0.35, 190),
                        right: 0,
                        top: -width * 0.05,
                        zIndex: 0,
                    }}
                    resizeMode="contain"
                />

                <View style={styles.header}>
                    <Text style={styles.title}>My Accounts</Text>

                    <Text style={styles.subtitle}>
                        Manage your saved accounts
                    </Text>
                </View>

            </View>

            {/* SEARCH */}
            <TextInput
                style={styles.search}
                placeholder="Search accounts..."
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={setSearch}
            />

            {/* SECTION HEADER */}
            <View style={styles.sectionHeader}>

                <Text style={styles.sectionTitle}>
                    Saved Accounts
                </Text>

                <Text style={styles.count}>
                    {accounts.length} accounts
                </Text>

            </View>

            {/* ACCOUNT LIST */}
            <ScrollView contentContainerStyle={styles.list}>

                {loading ? (
                    <Text style={styles.emptyText}>
                        Loading accounts...
                    </Text>
                ) : filteredAccounts.length === 0 ? (
                    <Text style={styles.emptyText}>
                        No accounts found.
                    </Text>
                ) : (
                    filteredAccounts.map(account => (

                        <TouchableOpacity
                            key={account.id}
                            style={styles.accountCard}
                            activeOpacity={0.9}
                            onPress={() => {
                                setExpandedId(
                                    expandedId === account.id
                                        ? null
                                        : account.id
                                );
                            }}
                        >

                            <View style={styles.accountInfo}>

                                {/* NAME AND ROLE ON THE SAME ROW */}
                                <View style={styles.nameRoleRow}>

                                    <Text style={styles.accountName}>
                                        {account.name}
                                    </Text>

                                    <View
                                        style={[
                                            styles.roleBadge,
                                            account.accountType === 'admin'
                                                ? styles.adminBadge
                                                : styles.userBadge
                                        ]}
                                    >
                                        <Text style={styles.roleText}>
                                            {account.accountType.toUpperCase()}
                                        </Text>
                                    </View>

                                </View>

                                <Text style={styles.accountEmail}>
                                    {account.email}
                                </Text>

                                <Text style={styles.accountUsername}>
                                    @{account.username}
                                </Text>

                            </View>

                            {/* EXPANDABLE ACTION BUTTONS */}
                            {isAdmin && expandedId === account.id && (
                                <View style={styles.actions}>

                                    <TouchableOpacity
                                        style={styles.editButton}
                                        onPress={() => {
                                            setExpandedId(null);
                                            openEditModal(account);
                                        }}
                                    >
                                        <Text style={styles.editText}>
                                            Edit
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={() => {
                                            setExpandedId(null);
                                            deleteAccount(account.id);
                                        }}
                                    >
                                        <Text style={styles.deleteText}>
                                            Delete
                                        </Text>
                                    </TouchableOpacity>

                                </View>
                            )}

                        </TouchableOpacity>

                    ))
                )}

            </ScrollView>

            {/* ADD ACCOUNT BUTTON */}
            {isAdmin && (
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={openAddModal}
                >
                    <Text style={styles.addButtonText}>
                        + Add New Account
                    </Text>
                </TouchableOpacity>
            )}

            {/* ADD / EDIT MODAL */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >

                <View style={styles.modalBackground}>

                    <View style={styles.modalContent}>

                        <Text style={styles.modalTitle}>
                            {editingId !== null ? 'Edit Account' : 'Add Account'}
                        </Text>

                        <ScrollView keyboardShouldPersistTaps="handled">

                            <TextInput
                                style={styles.input}
                                placeholder="Full name"
                                value={name}
                                onChangeText={setName}
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Username"
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                            />

                            {editingId === null && (
                                <>

                                    <View style={styles.passwordContainer}>

                                        <TextInput
                                            style={styles.passwordInput}
                                            placeholder="Password (minimum 8 characters)"
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry={!showPassword}
                                        />

                                        <TouchableOpacity
                                            onPress={() => setShowPassword(!showPassword)}
                                        >
                                            <Text style={styles.showPasswordText}>
                                                {showPassword ? 'Hide' : 'Show'}
                                            </Text>
                                        </TouchableOpacity>

                                    </View>

                                    <Text style={styles.roleLabel}>
                                        Account Type
                                    </Text>

                                    <View style={styles.roleOptions}>

                                        <TouchableOpacity
                                            style={[
                                                styles.roleOption,
                                                accountType === 'user' && styles.selectedRole
                                            ]}
                                            onPress={() => setAccountType('user')}
                                        >
                                            <Text style={styles.roleOptionText}>
                                                User
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[
                                                styles.roleOption,
                                                accountType === 'admin' && styles.selectedAdminRole
                                            ]}
                                            onPress={() => setAccountType('admin')}
                                        >
                                            <Text style={styles.roleOptionText}>
                                                Admin
                                            </Text>
                                        </TouchableOpacity>

                                    </View>

                                </>
                            )}

                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={saveAccount}
                            >
                                <Text style={styles.saveText}>
                                    {editingId !== null ? 'Save Changes' : 'Create Account'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    setModalVisible(false);
                                    resetForm();
                                }}
                            >
                                <Text style={styles.cancelText}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>

                                <Image>

                                </Image>
                        </ScrollView>

                    </View>

                </View>

            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        padding: 20,
        paddingTop: 55
    },

    headerContainer: {
        position: 'relative',
        justifyContent: 'center',
        minHeight: 130,
        marginBottom: 25,
    },

    header: {
        zIndex: 1,
    },

    title: {
        color: '#4b5052',
        fontSize: 27,
        fontWeight: 'bold'
    },

    subtitle: {
        color: '#3c3d3f',
        marginTop: 6
    },

    search: {
        backgroundColor: '#c0c2c4',
        color: '#1b1b1b',
        padding: 15,
        borderRadius: 10,
        marginBottom: 25
    },

    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15
    },

    sectionTitle: {
        color: '#3b3939',
        fontSize: 18,
        fontWeight: 'bold'
    },

    count: {
        color: '#34b8f5'
    },

    list: {
        paddingBottom: 20
    },

    accountCard: {
        backgroundColor: '#d7d9da',
        borderRadius: 12,
        padding: 16,
        marginBottom: 15
    },

    accountInfo: {
        marginBottom: 15
    },

    nameRoleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },

    accountName: {
        color: '#3b3838',
        fontSize: 17,
        fontWeight: 'bold',
        flex: 1,
    },

    accountEmail: {
        color: '#2b2c2e',
        marginTop: 5
    },

    accountUsername: {
        color: '#284686',
        marginTop: 4
    },

    roleBadge: {
        paddingVertical: 5,
        paddingHorizontal: 9,
        borderRadius: 6,
    },

    adminBadge: {
        backgroundColor: '#161616'
    },

    userBadge: {
        backgroundColor: '#494949c5'
    },

    roleText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: 'bold'
    },

    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10
    },

    editButton: {
        backgroundColor: '#1b1c1d',
        padding: 10,
        borderRadius: 8
    },

    editText: {
        color: '#FFFFFF'
    },

    deleteButton: {
        backgroundColor: '#74394c',
        padding: 10,
        borderRadius: 8
    },

    deleteText: {
        color: '#FF8585'
    },

    emptyText: {
        color: '#474747',
        textAlign: 'center',
        marginTop: 40
    },

    addButton: {
        backgroundColor: '#164996',
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        marginVertical: 12
    },

    addButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16
    },

    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        padding: 20
    },

    modalContent: {
        backgroundColor: '#e7e7e7',
        borderRadius: 16,
        padding: 22,
        maxHeight: '85%'
    },

    modalTitle: {
        color: '#131313',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 22
    },

    input: {
        backgroundColor: '#b0b1b3',
        color: '#FFFFFF',
        padding: 14,
        borderRadius: 9,
        marginBottom: 15
    },

    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#dbdcdf',
        borderRadius: 9,
        paddingHorizontal: 14,
        marginBottom: 15,
    },

    passwordInput: {
        flex: 1,
        color: '#000000',
        paddingVertical: 14,
    },

    showPasswordText: {
        color: '#284686',
        fontWeight: 'bold',
        paddingLeft: 10,
    },

    roleLabel: {
        color: '#464646',
        marginBottom: 10
    },

    roleOptions: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 18
    },

    roleOption: {
        flex: 1,
        backgroundColor: '#263449',
        padding: 13,
        borderRadius: 8,
        alignItems: 'center'
    },

    selectedRole: {
        backgroundColor: '#31558D'
    },

    selectedAdminRole: {
        backgroundColor: '#7545A3'
    },

    roleOptionText: {
        color: '#FFFFFF',
        fontWeight: '600'
    },

    saveButton: {
        backgroundColor: '#3f3f3f',
        padding: 15,
        borderRadius: 9,
        alignItems: 'center'
    },

    saveText: {
        color: '#FFFFFF',
        fontWeight: 'bold'
    },

    cancelButton: {
        padding: 13,
        alignItems: 'center'
    },

    cancelText: {
        color: '#000000'
    },

});
