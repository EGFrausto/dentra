import { supabase } from './supabase';
export { supabase };

// Global cache for stores
const storeCache = {};
const listeners = {};

// Internal helper to notify all listeners of a table
function notify(table) {
  if (listeners[table]) {
    const data = storeCache[table] || [];
    listeners[table].forEach(fn => fn(data));
  }
}

// Generic store wrapper for Supabase
function makeStore(table) {
  return {
    // get returns cache immediately, and triggers background fetch
    // if a callback is provided, it will be called when background fetch finishes
    get: async (onUpdate) => {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('user_id', session?.user?.id).maybeSingle();
      let clinicId = profile?.clinic_id;

      if (!clinicId && session?.user?.id) {
        const { data: owned } = await supabase.from('clinics').select('id').eq('user_id', session?.user?.id).maybeSingle();
        clinicId = owned?.id;
      }

      if (storeCache[table]) {
        // Silent background update
        let query = supabase.from(table).select('*');
        if (table !== 'profiles') {
          if (clinicId) query = query.eq('clinic_id', clinicId);
          else query = query.eq('user_id', session?.user?.id);
        }

        query.then(({ data }) => {
          if (data) {
            storeCache[table] = data;
            notify(table);
          }
        });
        return storeCache[table];
      }
      
      let query = supabase.from(table).select('*');
      if (table !== 'profiles') {
        if (clinicId) query = query.eq('clinic_id', clinicId);
        else query = query.eq('user_id', session?.user?.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      storeCache[table] = data || [];
      notify(table);
      return storeCache[table];
    },
    
    getCached: () => storeCache[table] || [],
    
    // Subscribe to changes in this table
    subscribe: (fn) => {
      if (!listeners[table]) listeners[table] = new Set();
      listeners[table].add(fn);
      // Return unsubscribe function
      return () => listeners[table].delete(fn);
    },
    
    add: async (item) => {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('user_id', session?.user?.id).maybeSingle();
      let clinicId = profile?.clinic_id;

      if (!clinicId && session?.user?.id) {
        const { data: owned } = await supabase.from('clinics').select('id').eq('user_id', session?.user?.id).maybeSingle();
        clinicId = owned?.id;
      }
      
      const newItem = { ...item, user_id: session?.user?.id };
      if (clinicId) newItem.clinic_id = clinicId;

      const { data, error } = await supabase.from(table).insert(newItem).select().single();
      if (error) throw error;
      if (storeCache[table]) {
        storeCache[table] = [data, ...storeCache[table]];
        notify(table);
      }
      return data;
    },
    
    update: async (id, updates) => {
      const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single();
      if (error) throw error;
      if (storeCache[table]) {
        storeCache[table] = storeCache[table].map(i => i.id === id ? data : i);
        notify(table);
      }
      return data;
    },
    
    remove: async (id) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      if (storeCache[table]) {
        storeCache[table] = storeCache[table].filter(i => i.id !== id);
        notify(table);
      }
    }
  };
}

export const patients     = makeStore('patients');
export const appointments = makeStore('appointments');
export const inventory    = makeStore('inventory');
export const clinics      = makeStore('clinics');
export const records      = makeStore('records');
export const xrays        = makeStore('xrays');
export const consents     = makeStore('consents');
export const plans        = makeStore('plans');
export const aptNotes     = makeStore('apt_notes');
export const profilesShared = makeStore('profiles');

// Special helper for the clinic/user profile (single record per user)
let profileCache = null;
const profListeners = new Set();

export const profile = {
  get: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    if (profileCache) {
       // background update
       supabase.from('profiles').select('*, clinics(*)').eq('user_id', user.id).limit(1).maybeSingle().then(({ data }) => {
         if (data) {
            const { clinics: clinicData, ...profileFields } = data;
            const merged = { ...clinicData, ...profileFields, clinic: clinicData };
            profileCache = merged;
            profListeners.forEach(fn => fn(merged));
         }
       });
       return profileCache;
    }

    const { data, error } = await supabase.from('profiles').select('*, clinics(*)').eq('user_id', user.id).limit(1).maybeSingle();
    if (error) console.error('Error fetching profile:', error);
    
    if (data) {
      const { clinics: clinicData, ...profileFields } = data;
      const merged = { ...clinicData, ...profileFields, clinic: clinicData };
      profileCache = merged;
      profListeners.forEach(fn => fn(merged));
      return merged;
    }
    
    // Fallback to old clinics logic if profile doesn't exist yet
    const { data: oldClinic } = await supabase.from('clinics').select('*').eq('user_id', user.id).maybeSingle();
    const merged = { ...oldClinic, role: 'admin' };
    profileCache = merged;
    return merged;
  },
  getCached: () => profileCache,
  subscribe: (fn) => {
    profListeners.add(fn);
    return () => profListeners.delete(fn);
  },
  set: async (updates) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: existing } = await supabase.from('clinics').select('id').eq('user_id', user?.id).maybeSingle();
    
    if (existing) {
      const { data, error } = await supabase.from('clinics').update(updates).eq('user_id', user?.id).select().single();
      if (error) throw error;
      profileCache = data;
    } else {
      const { data, error } = await supabase.from('clinics').insert([{ ...updates, user_id: user?.id }]).select().single();
      if (error) throw error;
      profileCache = data;
    }
    profListeners.forEach(fn => fn(profileCache));
  }
};