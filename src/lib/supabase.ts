import { createClient } from '@supabase/supabase-js';

// Clean the Supabase URL in case it includes '/rest/v1/' at the end
const rawUrl = "https://fzoxreixurclvgnvnybg.supabase.co/rest/v1/";
const sanitizedUrl = rawUrl.replace(/\/rest\/v1\/?$/, "");
const anonKey = "sb_publishable_UhKneN9PX5moCY8VN3b4LQ_dRZTNpDe";

// Initialize the real Supabase Client!
export const supabase = createClient(sanitizedUrl, anonKey);

// ========================================================================
// FIRESTORE COMPATIBILITY LAYER FOR SUPABASE
// ========================================================================

// Dummy db object that our code can continue to reference
export const db = { type: 'supabase_db' };

// Helpers to extract postgres-friendly table names from Firestore collection paths
function getTableName(collectionPath: string): string {
  const clean = collectionPath.replace(/\//g, '_');
  if (clean === 'settings_reportTemplate_chunks') {
    return 'settings_chunks';
  }
  return clean;
}

// 1. collection()
export function collection(dbInstance: any, ...paths: string[]) {
  return {
    type: 'collection',
    collectionName: paths.join('/')
  };
}

// 2. doc()
export function doc(dbInstance: any, ...paths: string[]) {
  const fullPath = paths.join('/');
  const segments = fullPath.split('/');
  const id = segments.pop() || '';
  const collectionName = segments.join('/');
  return {
    type: 'doc',
    collection: collectionName,
    id
  };
}

// 3. getDoc()
export async function getDoc(docRef: any) {
  const table = getTableName(docRef.collection);
  const id = docRef.id;

  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id);

    if (error || !data || data.length === 0) {
      return {
        id,
        exists: () => false,
        data: () => null
      };
    }

    const row = data[0];
    const rowData = row.data !== undefined ? row.data : row;

    return {
      id,
      exists: () => true,
      data: () => rowData
    };
  } catch (err: any) {
    console.warn(`getDoc error for table [${table}] id [${id}]:`, err);
    return {
      id,
      exists: () => false,
      data: () => null
    };
  }
}

// 4. getDocs()
export async function getDocs(collectionRef: any) {
  const table = getTableName(collectionRef.collectionName);

  try {
    const { data, error } = await supabase
      .from(table)
      .select('*');

    // If table doesn't exist, handle it gracefully
    if (error) {
      if (error.code === 'PGRST205') {
        console.warn(`Table [${table}] does not exist in Supabase. Returning empty list.`);
        return {
          docs: [],
          forEach: (cb: any) => {},
          empty: true,
          size: 0
        };
      }
      throw error;
    }

    const docs = (data || []).map((row: any) => {
      const rowData = row.data !== undefined ? row.data : row;
      return {
        id: row.id || '',
        data: () => rowData
      };
    });

    return {
      docs,
      forEach: (cb: any) => docs.forEach(cb),
      empty: docs.length === 0,
      size: docs.length
    };
  } catch (err: any) {
    console.warn(`getDocs error for table [${table}]:`, err);
    return {
      docs: [],
      forEach: (cb: any) => {},
      empty: true,
      size: 0
    };
  }
}

// 5. setDoc()
export async function setDoc(docRef: any, rawData: any) {
  const table = getTableName(docRef.collection);
  const id = docRef.id;

  // Let's first clean up rawData in case it contains Firestore functions
  const payload = {
    id,
    data: rawData
  };

  try {
    // First, try upserting using our premium schema layout (id, data JSONB column)
    const { error } = await supabase
      .from(table)
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      if (error.message?.includes("security policy") || error.message?.includes("row-level security") || error.code === '42501') {
        localStorage.setItem('supabase_rls_policy_active_warning', 'true');
        window.dispatchEvent(new Event('supabase_rls_warning'));
        throw error;
      }
      // If it failed because of missing column 'data', try inserting directly as flat columns
      console.warn(`Upsert as (id, data) JSONB failed for table [${table}]. Trying direct flat object upsert...`);
      const { error: flatError } = await supabase
        .from(table)
        .upsert({ id, ...rawData }, { onConflict: 'id' });

      if (flatError) {
        if (flatError.message?.includes("security policy") || flatError.message?.includes("row-level security") || flatError.code === '42501') {
          localStorage.setItem('supabase_rls_policy_active_warning', 'true');
          window.dispatchEvent(new Event('supabase_rls_warning'));
        }
        throw flatError;
      }
    }
  } catch (err: any) {
    console.warn(`setDoc failed for table [${table}] ID [${id}]:`, err);
    throw new Error(`Erro ao salvar no Supabase na tabela ${table}: ` + (err.message || err));
  }
}

// 6. deleteDoc()
export async function deleteDoc(docRef: any) {
  const table = getTableName(docRef.collection);
  const id = docRef.id;

  try {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (err: any) {
    console.warn(`deleteDoc failed for table [${table}] ID [${id}]:`, err);
    throw new Error(`Erro ao deletar no Supabase na tabela ${table}: ` + (err.message || err));
  }
}

// 7. writeBatch()
export function writeBatch(dbInstance: any) {
  const operations: Array<() => Promise<void>> = [];

  return {
    set: (docRef: any, data: any) => {
      operations.push(async () => {
        await setDoc(docRef, data);
      });
    },
    update: (docRef: any, data: any) => {
      operations.push(async () => {
        const current = await getDoc(docRef);
        const merged = current.exists() ? { ...current.data(), ...data } : data;
        await setDoc(docRef, merged);
      });
    },
    delete: (docRef: any) => {
      operations.push(async () => {
        await deleteDoc(docRef);
      });
    },
    commit: async () => {
      for (const op of operations) {
        await op();
      }
    }
  };
}

// ========================================================================
// SUPABASE AUTH COMPATIBILITY LAYER (MAPPING FOR GOOGLE AUTH POPUP & DIRECT DB LOGIN)
// ========================================================================

export interface SupabaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

class SupabaseAuth {
  private listeners: Array<(user: SupabaseUser | null) => void> = [];
  public currentUser: SupabaseUser | null = null;
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      // Check first for custom DB-backed local session
      const savedUser = localStorage.getItem('supabase_db_auth_user');
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
        this.isInitialized = true;
        this.listeners.forEach(cb => cb(this.currentUser));
        return;
      }

      // Fallback to standard Supabase Auth session
      const { data: { session } } = await supabase.auth.getSession();
      this.updateState(session?.user || null);

      // Listen to future changes
      supabase.auth.onAuthStateChange((event, session) => {
        if (!localStorage.getItem('supabase_db_auth_user')) {
          this.updateState(session?.user || null);
        }
      });
    } catch (err) {
      console.error("Supabase Auth init error:", err);
    } finally {
      this.isInitialized = true;
    }
  }

  private updateState(user: any) {
    if (user) {
      this.currentUser = {
        uid: user.id,
        email: user.email || null,
        displayName: user.user_metadata?.full_name || user.email?.split('@')[0] || "Usuário",
        photoURL: user.user_metadata?.avatar_url || null
      };
    } else {
      this.currentUser = null;
    }
    this.listeners.forEach(cb => cb(this.currentUser));
  }

  // Pure Database-Backed secure Access password login
  async signInWithEmailAndPassword(email: string, pass: string): Promise<SupabaseUser> {
    const cleanEmail = email.trim().toLowerCase();

    // Query authorized_users directly
    const { data: rows, error } = await supabase
      .from('authorized_users')
      .select('*')
      .eq('id', cleanEmail);

    if (error) {
      throw new Error(`Conexão com o banco falhou: ${error.message}`);
    }

    let dbUserDoc: any = null;

    if (!rows || rows.length === 0) {
      // Auto-bootstrap main system administrator if first login
      if (cleanEmail === 'jeffersonayresjefferson@gmail.com') {
        dbUserDoc = {
          email: cleanEmail,
          role: 'admin',
          addedBy: 'sistema',
          createdAt: Date.now(),
          password: pass
        };
        const { error: insErr } = await supabase
          .from('authorized_users')
          .insert({ id: cleanEmail, data: dbUserDoc });
        if (insErr) {
          console.warn("Aviso: Falha ao inserir administrador no bando de dados:", insErr);
          // Set warning flags
          if (insErr.message?.includes("security policy") || insErr.message?.includes("row-level security") || insErr.code === '42501') {
            localStorage.setItem('supabase_rls_policy_active_warning', 'true');
            window.dispatchEvent(new Event('supabase_rls_warning'));
          } else {
            localStorage.setItem('supabase_db_unreachable_warning', insErr.message || 'Erro de conexão');
          }
        }
      } else {
        throw new Error('E-mail não está cadastrado ou autorizado no sistema. Solicite permissão ao administrador.');
      }
    } else {
      const row = rows[0];
      dbUserDoc = row.data !== undefined ? row.data : row;

      // Ensure data field format is correctly parsed or structured
      const userData = (typeof dbUserDoc === 'string') ? JSON.parse(dbUserDoc) : dbUserDoc;

      if (!userData.password) {
        // First login of this authorized user: register password they provided
        userData.password = pass;
        const { error: updErr } = await supabase
          .from('authorized_users')
          .upsert({ id: cleanEmail, data: userData });
        if (updErr) {
          throw new Error(`Erro ao registrar sua senha de acesso: ${updErr.message}`);
        }
      } else {
        // Authenticate
        if (userData.password !== pass) {
          throw new Error('Chave de Acesso incorreta para este e-mail.');
        }
      }
    }

    const authenticatedUser: SupabaseUser = {
      uid: cleanEmail,
      email: cleanEmail,
      displayName: cleanEmail.split('@')[0],
      photoURL: null
    };

    this.currentUser = authenticatedUser;
    localStorage.setItem('supabase_db_auth_user', JSON.stringify(authenticatedUser));
    this.listeners.forEach(cb => cb(authenticatedUser));
    return authenticatedUser;
  }

  onAuthStateChanged(callback: (user: SupabaseUser | null) => void) {
    this.listeners.push(callback);
    if (this.isInitialized || this.currentUser) {
      callback(this.currentUser);
    } else {
      setTimeout(() => callback(this.currentUser), 400);
    }
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  async signInWithPopup() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
  }

  async signOut() {
    this.currentUser = null;
    localStorage.removeItem('supabase_db_auth_user');
    try {
      await supabase.auth.signOut();
    } catch (_) {}
    this.listeners.forEach(cb => cb(null));
  }
}

export const auth = new SupabaseAuth();

export function onAuthStateChanged(authInstance: any, callback: (user: any) => void) {
  return auth.onAuthStateChanged(callback);
}

export async function signInWithPopup(authInstance: any, provider: any) {
  return await auth.signInWithPopup();
}

export async function signOut(authInstance: any) {
  return await auth.signOut();
}

export class GoogleAuthProvider {
  setCustomParameters(params?: any) {}
}

export type { SupabaseUser as User };
