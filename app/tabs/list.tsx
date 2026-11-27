import React,{useEffect,useState}from'react';
import{View,Text,TextInput,TouchableOpacity,StyleSheet,ScrollView,Alert,Modal,Image,useWindowDimensions}from'react-native';
import{router}from'expo-router';
import{Account,getAccounts,getLoggedInAccount,updateAccount,createAdminAccount,deleteAdminAccount}from'../../database/account';

export default function List(){
 const{width}=useWindowDimensions();
 const[accounts,setAccounts]=useState<Account[]>([]);
 const[search,setSearch]=useState('');
 const[modalVisible,setModalVisible]=useState(false);
 const[editingId,setEditingId]=useState<string|null>(null);
 const[expandedId,setExpandedId]=useState<string|null>(null);
 const[name,setName]=useState('');
 const[email,setEmail]=useState('');
 const[username,setUsername]=useState('');
 const[password,setPassword]=useState('');
 const[loading,setLoading]=useState(true);
 const[saving,setSaving]=useState(false);
 const[saveMessage,setSaveMessage]=useState('');
 const[saveMessageType,setSaveMessageType]=useState<'error'|'success'|''>('');
 const[isAdmin,setIsAdmin]=useState(false);
 const[currentAccountId,setCurrentAccountId]=useState<string|null>(null);
 const fishy=require('../../assets/fhead.png');

 async function loadAccounts(){
  try{
   const me=await getLoggedInAccount();
   if(!me){router.replace('/signIn');return;}
   setCurrentAccountId(me.id);
   setIsAdmin(me.accountType==='admin');
   setAccounts(await getAccounts());
  }catch(e){console.error(e);Alert.alert('Error','Could not load accounts.');}
  finally{setLoading(false);}
 }
 useEffect(()=>{loadAccounts();},[]);

 function openCreateModal(){
  setEditingId(null);setName('');setEmail('');setUsername('');setPassword('');setSaveMessage('');setSaveMessageType('');setModalVisible(true);
 }
 function openEditModal(a:Account){
  if(!isAdmin)return;
  setEditingId(a.id);setName(a.name);setEmail(a.email);setUsername(a.username);setPassword('');setSaveMessage('');setSaveMessageType('');setModalVisible(true);
 }
 async function saveAccount(){
  setSaveMessage('');setSaveMessageType('');
  if(!name.trim()||!username.trim()){setSaveMessage('Fill in the name and username fields.');setSaveMessageType('error');return;}
  if(!editingId&&(!email.trim()||!password)){setSaveMessage('Email and password are required for a new account.');setSaveMessageType('error');return;}
  try{
   setSaving(true);
   if(editingId) await updateAccount(editingId,name.trim(),username.trim());
   else await createAdminAccount(name.trim(),email.trim(),username.trim(),password);
   setModalVisible(false);setEditingId(null);setSaveMessage('');setSaveMessageType('');await loadAccounts();
  }catch(e:any){
   console.error('Save account failed:',e);
   const message=e?.message||e?.context?.message||'Could not save account. Check your connection and try again.';
   setSaveMessage(String(message));setSaveMessageType('error');
  }
  finally{setSaving(false);}
 }
 function confirmDelete(a:Account){
  if(!isAdmin)return;
  Alert.alert('Delete account',`Permanently delete ${a.email}? This cannot be undone.`,[
   {text:'Cancel',style:'cancel'},
   {text:'Delete',style:'destructive',onPress:async()=>{
    try{await deleteAdminAccount(a.id);setExpandedId(null);Alert.alert('Deleted','Account deleted.');await loadAccounts();}
    catch(e:any){Alert.alert('Error',e?.message||'Could not delete account.');}
   }}
  ]);
 }
 const filtered=accounts.filter(a=>a.name.toLowerCase().includes(search.toLowerCase())||a.email.toLowerCase().includes(search.toLowerCase())||a.username.toLowerCase().includes(search.toLowerCase()));
 return <View style={styles.container}>
  <View style={styles.headerContainer}>
   <Image source={fishy} style={{position:'absolute',width:Math.min(width*.4,220),height:Math.min(width*.35,190),right:0,top:-width*.05,zIndex:0}} resizeMode="contain"/>
   <View style={styles.header}><Text style={styles.title}>My Accounts</Text><Text style={styles.subtitle}>{isAdmin?'Manage registered accounts':'Your account'}</Text></View>
  </View>
  <TextInput style={styles.search} placeholder="Search accounts..." placeholderTextColor="#94A3B8" value={search} onChangeText={setSearch}/>
  {isAdmin&&<TouchableOpacity style={styles.addButton} onPress={openCreateModal}><Text style={styles.addButtonText}>+ Create Account</Text></TouchableOpacity>}
  <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Saved Accounts</Text><Text style={styles.count}>{accounts.length} accounts</Text></View>
  <ScrollView contentContainerStyle={styles.list}>
   {loading?<Text style={styles.emptyText}>Loading accounts...</Text>:filtered.length===0?<Text style={styles.emptyText}>No accounts found.</Text>:filtered.map(a=>
    <TouchableOpacity key={a.id} style={styles.accountCard} activeOpacity={.9} onPress={()=>setExpandedId(expandedId===a.id?null:a.id)}>
     <View style={styles.accountInfo}>
      <View style={styles.nameRoleRow}><Text style={styles.accountName}>{a.name}</Text><View style={[styles.roleBadge,a.accountType==='admin'?styles.adminBadge:styles.userBadge]}><Text style={styles.roleText}>{a.accountType.toUpperCase()}</Text></View></View>
      <Text style={styles.accountEmail}>{a.email}</Text><Text style={styles.accountUsername}>@{a.username}</Text>
     </View>
     {isAdmin&&expandedId===a.id&&<View style={styles.actions}>
      <TouchableOpacity style={styles.editButton} onPress={()=>openEditModal(a)}><Text style={styles.editText}>Edit</Text></TouchableOpacity>
      {a.id!==currentAccountId&&<TouchableOpacity style={styles.deleteButton} onPress={()=>confirmDelete(a)}><Text style={styles.deleteText}>Delete</Text></TouchableOpacity>}
     </View>}
    </TouchableOpacity>
   )}
  </ScrollView>
  <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={()=>setModalVisible(false)}>
   <View style={styles.modalBackground}><View style={styles.modalContent}>
    <Text style={styles.modalTitle}>{editingId?'Edit Account':'Create Account'}</Text>
    <ScrollView keyboardShouldPersistTaps="handled">
     <TextInput style={styles.input} placeholder="Full name" placeholderTextColor="#555" value={name} onChangeText={setName}/>
     <TextInput style={[styles.input,editingId?{opacity:.65}:null]} placeholder="Email" placeholderTextColor="#555" value={email} onChangeText={setEmail} editable={!editingId} autoCapitalize="none" keyboardType="email-address"/>
     <TextInput style={styles.input} placeholder="Username" placeholderTextColor="#555" value={username} onChangeText={setUsername} autoCapitalize="none"/>
     {!editingId&&<TextInput style={styles.input} placeholder="Temporary password" placeholderTextColor="#555" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none"/>}
     {saveMessage!==''&&<Text style={[styles.formMessage,saveMessageType==='error'?styles.formError:styles.formSuccess]}>{saveMessage}</Text>}
     <TouchableOpacity style={[styles.saveButton,saving&&{opacity:.6}]} onPress={saveAccount} disabled={saving}><Text style={styles.saveText}>{saving?'Please wait...':editingId?'Save Changes':'Create Account'}</Text></TouchableOpacity>
     <TouchableOpacity style={styles.cancelButton} onPress={()=>setModalVisible(false)} disabled={saving}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
    </ScrollView>
   </View></View>
  </Modal>
 </View>;
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

    formMessage: { padding: 11, borderRadius: 8, marginBottom: 12, overflow: 'hidden' },
    formError: { backgroundColor: '#ffe1e1', color: '#8b1e1e' },
    formSuccess: { backgroundColor: '#dff5e5', color: '#14532d' },

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
