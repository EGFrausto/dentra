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
      // 1. If we have a callback, add it for this specific call (one-time or persistent depending on usage)
      // Actually, it's better to just return the cache and let the background fetch notify via the global listener system.
      
      if (storeCache[table]) {
        // Silent background update
        supabase.from(table).select('*').then(({ data }) => {
          if (data) {
            storeCache[table] = data;
            notify(table);
          }
        });
        return storeCache[table];
      }
      
      const { data, error } = await supabase.from(table).select('*');
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
      const { data, error } = await supabase.from(table).insert({ ...item, user_id: session?.user?.id }).select().single();
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

// Special helper for the clinic/user profile (single record per user)
let profileCache = null;
const profListeners = new Set();

export const profile = {
  get: async () => {
    if (profileCache) {
       // background update
       supabase.auth.getUser().then(({ data: { user } }) => {
         if (user) {
            supabase.from('clinics').select('*').eq('user_id', user.id).maybeSingle().then(({ data }) => {
              if (data) {
                profileCache = data;
                profListeners.forEach(fn => fn(data));
              }
            });
         }
       });
       return profileCache;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase.from('clinics').select('*').eq('user_id', user?.id).maybeSingle();
    if (error) console.error('Error fetching profile:', error);
    profileCache = data;
    profListeners.forEach(fn => fn(data));
    return data;
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