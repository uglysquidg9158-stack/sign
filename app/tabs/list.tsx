import React,{useEffect,useState}from'react';import{View,Text,TextInput,TouchableOpacity,StyleSheet,ScrollView,Alert,Modal,Image,useWindowDimensions}from'react-native';import{router}from'expo-router';import{Account,getAccounts,getLoggedInAccount,updateAccount}from'../../database/account';
export default function List(){const{width}=useWindowDimensions();const[accounts,setAccounts]=useState<Account[]>([]),[search,setSearch]=useState(''),[modalVisible,setModalVisible]=useState(false),[editingId,setEditingId]=useState<string|null>(null),[expandedId,setExpandedId]=useState<string|null>(null),[name,setName]=useState(''),[email,setEmail]=useState(''),[username,setUsername]=useState(''),[loading,setLoading]=useState(true),[isAdmin,setIsAdmin]=useState(false);const fishy=require('../../assets/fhead.png');
async function loadAccounts(){try{const me=await getLoggedInAccount();if(!me){router.replace('/signIn');return;}setIsAdmin(me.accountType==='admin');setAccounts(await getAccounts());}catch(e){console.error(e);Alert.alert('Error','Could not load accounts.');}finally{setLoading(false);}}useEffect(()=>{loadAccounts();},[]);
function openEditModal(a:Account){if(!isAdmin)return;setEditingId(a.id);setName(a.name);setEmail(a.email);setUsername(a.username);setModalVisible(true);}
async function saveAccount(){if(!editingId)return;if(!name.trim()||!username.trim()){Alert.alert('Error','Fill in all required fields.');return;}try{await updateAccount(editingId,name.trim(),username.trim());Alert.alert('Success','Account updated.');setModalVisible(false);setEditingId(null);await loadAccounts();}catch(e:any){Alert.alert('Error',e.message||'Could not update account.');}}
const filtered=accounts.filter(a=>a.name.toLowerCase().includes(search.toLowerCase())||a.email.toLowerCase().includes(search.toLowerCase())||a.username.toLowerCase().includes(search.toLowerCase()));
return <View style={styles.container}><View style={styles.headerContainer}><Image source={fishy} style={{position:'absolute',width:Math.min(width*.4,220),height:Math.min(width*.35,190),right:0,top:-width*.05,zIndex:0}} resizeMode="contain"/><View style={styles.header}><Text style={styles.title}>My Accounts</Text><Text style={styles.subtitle}>{isAdmin?'Manage registered accounts':'Your account'}</Text></View></View><TextInput style={styles.search} placeholder="Search accounts..." placeholderTextColor="#94A3B8" value={search} onChangeText={setSearch}/><View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Saved Accounts</Text><Text style={styles.count}>{accounts.length} accounts</Text></View><ScrollView contentContainerStyle={styles.list}>{loading?<Text style={styles.emptyText}>Loading accounts...</Text>:filtered.length===0?<Text style={styles.emptyText}>No accounts found.</Text>:filtered.map(a=><TouchableOpacity key={a.id} style={styles.accountCard} activeOpacity={.9} onPress={()=>setExpandedId(expandedId===a.id?null:a.id)}><View style={styles.accountInfo}><View style={styles.nameRoleRow}><Text style={styles.accountName}>{a.name}</Text><View style={[styles.roleBadge,a.accountType==='admin'?styles.adminBadge:styles.userBadge]}><Text style={styles.roleText}>{a.accountType.toUpperCase()}</Text></View></View><Text style={styles.accountEmail}>{a.email}</Text><Text style={styles.accountUsername}>@{a.username}</Text></View>{isAdmin&&expandedId===a.id&&<View style={styles.actions}><TouchableOpacity style={styles.editButton} onPress={()=>{setExpandedId(null);openEditModal(a);}}><Text style={styles.editText}>Edit</Text></TouchableOpacity></View>}</TouchableOpacity>)}</ScrollView><Modal visible={modalVisible} transparent animationType="slide" onRequestClose={()=>setModalVisible(false)}><View style={styles.modalBackground}><View style={styles.modalContent}><Text style={styles.modalTitle}>Edit Account</Text><ScrollView keyboardShouldPersistTaps="handled"><TextInput style={styles.input} placeholder="Full name" value={name} onChangeText={setName}/><TextInput style={[styles.input,{opacity:.65}]} value={email} editable={false}/><TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} autoCapitalize="none"/><TouchableOpacity style={styles.saveButton} onPress={saveAccount}><Text style={styles.saveText}>Save Changes</Text></TouchableOpacity><TouchableOpacity style={styles.cancelButton} onPress={()=>setModalVisible(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity></ScrollView></View></View></Modal></View>;}
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
