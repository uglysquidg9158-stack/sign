import { supabase } from '../lib/supabase';
export type AccountType='user'|'admin';export type Account={id:string;name:string;email:string;username:string;accountType:AccountType};export type LoginResult={success:boolean;account?:Account;message?:string};type Row={id:string;name:string;email:string;username:string;role:AccountType};const map=(r:Row):Account=>({id:r.id,name:r.name,email:r.email,username:r.username,accountType:r.role});
export function validateUsername(v:string):string|null{if(!v.trim())return'Username is required.';if(v.length<4)return'Username must contain at least 4 characters.';if(!/^[a-zA-Z0-9_]+$/.test(v))return'Username can only contain letters, numbers and underscores.';return null;}
export function validatePassword(v:string):string|null{if(!v)return'Password is required.';if(v.length<8)return'Password must contain at least 8 characters.';if(!/[A-Z]/.test(v))return'Password must contain an uppercase letter.';if(!/[a-z]/.test(v))return'Password must contain a lowercase letter.';if(!/[0-9]/.test(v))return'Password must contain a number.';return null;}
export async function registerAccount(name:string,email:string,username:string,password:string):Promise<void>{const u=validateUsername(username);if(u)throw new Error(u);const p=validatePassword(password);if(p)throw new Error(p);if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))throw new Error('Enter a valid email address.');const{error}=await supabase.auth.signUp({email:email.trim(),password,options:{data:{name:name.trim(),username:username.trim().toLowerCase()}}});if(error)throw error;}
export async function loginAccount(email:string,password:string):Promise<LoginResult>{if(!email.trim()||!password)return{success:false,message:'Enter your email and password.'};const{error}=await supabase.auth.signInWithPassword({email:email.trim(),password});if(error)return{success:false,message:error.message};const{data,error:e}=await supabase.from('profiles').select('id,name,email,username,role').single();if(e||!data){await supabase.auth.signOut();return{success:false,message:'Your profile could not be loaded. Please contact support.'};}return{success:true,account:map(data as Row)};}
export async function getLoggedInAccount():Promise<Account|null>{const{data:u,error:ue}=await supabase.auth.getUser();if(ue||!u.user)return null;const{data,error}=await supabase.from('profiles').select('id,name,email,username,role').eq('id',u.user.id).single();return error||!data?null:map(data as Row);}
export async function clearUserSession():Promise<void>{const{error}=await supabase.auth.signOut();if(error)throw error;}
export async function getAccounts():Promise<Account[]>{const{data,error}=await supabase.from('profiles').select('id,name,email,username,role').order('created_at',{ascending:false});if(error)throw error;return(data??[]).map(r=>map(r as Row));}
export async function updateAccount(id:string,name:string,username:string):Promise<void>{const n=name.trim(),u=username.trim().toLowerCase();if(!n)throw new Error('Name is required.');const e=validateUsername(u);if(e)throw new Error(e);const{error}=await supabase.from('profiles').update({name:n,username:u,updated_at:new Date().toISOString()}).eq('id',id);if(error)throw error;}

export async function createAdminAccount(name:string,email:string,username:string,password:string):Promise<void>{
  const n=name.trim(),e=email.trim().toLowerCase(),u=username.trim().toLowerCase();
  if(!n)throw new Error('Name is required.');
  const ve=validateUsername(u);if(ve)throw new Error(ve);
  const vp=validatePassword(password);if(vp)throw new Error(vp);
  const{data,error}=await supabase.functions.invoke('admin-accounts',{body:{action:'create',name:n,email:e,username:u,password}});
  if(error)throw error;if(data?.error)throw new Error(data.error);
}
export async function deleteAdminAccount(id:string):Promise<void>{
  const{data,error}=await supabase.functions.invoke('admin-accounts',{body:{action:'delete',id}});
  if(error)throw error;if(data?.error)throw new Error(data.error);
}
