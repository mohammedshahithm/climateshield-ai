"use client";

// Mock Event Emitter for realtime
class MockEventEmitter {
  private listeners: Record<string, Function[]> = {};

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  emit(event: string, payload: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(payload));
    }
  }
}

export const mockRealtime = new MockEventEmitter();
let authListeners: Function[] = [];

const MOCK_USERS_KEY = "climateshield_mock_users";
const MOCK_SESSION_KEY = "climateshield_mock_session";

class MockQueryBuilder {
  private tableName: string;
  private action: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private insertData: any = null;
  private updateData: any = null;
  private filters: Array<(row: any) => boolean> = [];
  private orderField: string | null = null;
  private orderAscending = true;
  private isSingle = false;
  private isMaybeSingle = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns?: string, options?: any) {
    this.action = 'select';
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push(row => row[column] === value);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderField = column;
    this.orderAscending = options?.ascending ?? true;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  limit(count: number) {
    return this;
  }

  insert(data: any) {
    this.action = 'insert';
    this.insertData = data;
    return this;
  }

  update(data: any) {
    this.action = 'update';
    this.updateData = data;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  private getRows(): any[] {
    if (typeof window === 'undefined') return [];
    
    const key = `mock_${this.tableName}`;
    const dataStr = localStorage.getItem(key);
    if (!dataStr) {
      let initialData: any[] = [];
      if (this.tableName === 'incidents') {
        initialData = [
          {
            id: "inc-1",
            title: "Velachery Waterlogging",
            category: "Flood",
            description: "Waterlogging up to 3 feet in Velachery residential areas after sudden cloudburst.",
            location_name: "Velachery Lowlands",
            latitude: 12.9801,
            longitude: 80.2224,
            status: "open",
            created_by: "system-user-id",
            created_at: new Date(Date.now() - 3600000 * 2).toISOString()
          },
          {
            id: "inc-2",
            title: "Tambaram Power Grid Outage",
            category: "Power Outage",
            description: "Substation transformer explosion has cut off power to over 5,000 households.",
            location_name: "Tambaram West Depot",
            latitude: 12.9249,
            longitude: 80.1011,
            status: "investigating",
            created_by: "system-user-id",
            created_at: new Date(Date.now() - 3600000 * 4).toISOString()
          },
          {
            id: "inc-3",
            title: "T Nagar Industrial Fire",
            category: "Fire",
            description: "Minor electric short circuit fire at chemical storage warehouse.",
            location_name: "T Nagar Industrial Block",
            latitude: 13.0418,
            longitude: 80.2341,
            status: "resolved",
            created_by: "system-user-id",
            created_at: new Date(Date.now() - 3600000 * 24).toISOString()
          }
        ];
      } else if (this.tableName === 'alerts') {
        initialData = [
          {
            id: "ALRT-1001",
            title: "Flash Flood Warning",
            message: "High risk of flash flooding in low-lying areas of Velachery. Avoid travel and secure essential assets.",
            severity: "critical",
            location: "Velachery",
            status: "active",
            created_at: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: "ALRT-1002",
            title: "Extreme Heat Alert",
            message: "Severe heatwave conditions expected. Temperatures to exceed 42°C in T Nagar.",
            severity: "high",
            location: "T Nagar",
            status: "active",
            created_at: new Date(Date.now() - 3600000 * 3).toISOString()
          }
        ];
      } else if (this.tableName === 'shelters') {
        initialData = [
          {
            id: "sh-1",
            name: "Chennai Community Shelter",
            address: "Velachery Main Rd",
            latitude: 12.9790,
            longitude: 80.2210,
            capacity: 500,
            occupied: 320,
            status: "Available",
            created_at: new Date(Date.now() - 3600000 * 5).toISOString()
          },
          {
            id: "sh-2",
            name: "Trichy Relief Center",
            address: "Cantonment, Trichy",
            latitude: 10.8050,
            longitude: 78.6856,
            capacity: 300,
            occupied: 150,
            status: "Available",
            created_at: new Date(Date.now() - 3600000 * 10).toISOString()
          },
          {
            id: "sh-3",
            name: "Kallakurichi Government Shelter",
            address: "Kachirapalayam Rd",
            latitude: 11.7380,
            longitude: 78.9620,
            capacity: 250,
            occupied: 250,
            status: "Full",
            created_at: new Date(Date.now() - 3600000 * 20).toISOString()
          },
          {
            id: "sh-4",
            name: "Tambaram Emergency Hall",
            address: "Tambaram West",
            latitude: 12.9260,
            longitude: 80.1000,
            capacity: 400,
            occupied: 0,
            status: "Maintenance",
            created_at: new Date(Date.now() - 3600000 * 30).toISOString()
          }
        ];
      } else if (this.tableName === 'resources') {
        initialData = [
          {
            id: "res-1",
            name: "Ambulance Unit 1",
            type: "Ambulance",
            location: "Velachery Hospital",
            latitude: 12.9780,
            longitude: 80.2230,
            status: "Available",
            created_at: new Date(Date.now() - 3600000 * 2).toISOString()
          },
          {
            id: "res-2",
            name: "Ambulance Unit 2",
            type: "Ambulance",
            location: "Guindy Depot",
            latitude: 13.0067,
            longitude: 80.2206,
            status: "En Route",
            created_at: new Date(Date.now() - 3600000 * 5).toISOString()
          },
          {
            id: "res-3",
            name: "Rescue Team Alpha",
            type: "Rescue Team",
            location: "Adyar Flyover",
            latitude: 13.0012,
            longitude: 80.2565,
            status: "Deployed",
            created_at: new Date(Date.now() - 3600000 * 12).toISOString()
          },
          {
            id: "res-4",
            name: "Rescue Team Bravo",
            type: "Rescue Team",
            location: "Tambaram Station",
            latitude: 12.9230,
            longitude: 80.1100,
            status: "Available",
            created_at: new Date(Date.now() - 3600000 * 18).toISOString()
          },
          {
            id: "res-5",
            name: "Water Tanker W-01",
            type: "Water Tanker",
            location: "Central Depot",
            latitude: 13.0827,
            longitude: 80.2707,
            status: "Available",
            created_at: new Date(Date.now() - 3600000 * 24).toISOString()
          },
          {
            id: "res-6",
            name: "Fire Response Unit",
            type: "Fire Unit",
            location: "Anna Nagar",
            latitude: 13.0850,
            longitude: 80.2100,
            status: "Available",
            created_at: new Date(Date.now() - 3600000 * 36).toISOString()
          }
        ];
      } else if (this.tableName === 'profiles') {
        initialData = [
          {
            id: "system-user-id",
            role: "citizen",
            full_name: "Mock Citizen",
            created_at: new Date(Date.now() - 86400000 * 10).toISOString()
          },
          {
            id: "system-admin-id",
            role: "admin",
            full_name: "Mock Administrator",
            created_at: new Date(Date.now() - 86400000 * 10).toISOString()
          }
        ];
      } else if (this.tableName === 'ai_queries') {
        initialData = [];
      }
      localStorage.setItem(key, JSON.stringify(initialData));
      return initialData;
    }
    return JSON.parse(dataStr);
  }

  private saveRows(rows: any[]) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`mock_${this.tableName}`, JSON.stringify(rows));
    }
  }

  async execute() {
    const rows = this.getRows();

    if (this.action === 'select') {
      let filtered = rows;
      for (const filter of this.filters) {
        filtered = filtered.filter(filter);
      }

      if (this.orderField) {
        const field = this.orderField;
        const asc = this.orderAscending;
        filtered.sort((a, b) => {
          const valA = a[field];
          const valB = b[field];
          if (valA === valB) return 0;
          if (valA < valB) return asc ? -1 : 1;
          return asc ? 1 : -1;
        });
      }

      const count = filtered.length;

      if (this.isSingle || this.isMaybeSingle) {
        return { data: filtered[0] || null, error: null, count };
      }

      return { data: filtered, error: null, count };
    }

    if (this.action === 'insert') {
      const dataToInsert = Array.isArray(this.insertData) ? this.insertData : [this.insertData];
      const insertedRows = dataToInsert.map((item: any) => {
        return {
          id: item.id || `mock-id-${Math.random().toString(36).substr(2, 9)}`,
          created_at: new Date().toISOString(),
          ...item
        };
      });

      const newRows = [...insertedRows, ...rows];
      this.saveRows(newRows);

      insertedRows.forEach(row => {
        mockRealtime.emit(`${this.tableName}_changes`, {
          eventType: 'INSERT',
          new: row,
          old: {}
        });
      });

      return { data: this.isSingle ? insertedRows[0] : insertedRows, error: null };
    }

    if (this.action === 'update') {
      const updatedRows: any[] = [];
      const newRows = rows.map((row: any) => {
        let matches = true;
        for (const filter of this.filters) {
          if (!filter(row)) {
            matches = false;
            break;
          }
        }
        if (matches) {
          const updated = { ...row, ...this.updateData, updated_at: new Date().toISOString() };
          updatedRows.push(updated);
          return updated;
        }
        return row;
      });

      this.saveRows(newRows);

      updatedRows.forEach(row => {
        mockRealtime.emit(`${this.tableName}_changes`, {
          eventType: 'UPDATE',
          new: row,
          old: { id: row.id }
        });
      });

      return { data: this.isSingle ? updatedRows[0] : updatedRows, error: null };
    }

    if (this.action === 'delete') {
      const deletedRows: any[] = [];
      const newRows = rows.filter((row: any) => {
        let matches = true;
        for (const filter of this.filters) {
          if (!filter(row)) {
            matches = false;
            break;
          }
        }
        if (matches) {
          deletedRows.push(row);
          return false;
        }
        return true;
      });

      this.saveRows(newRows);

      deletedRows.forEach(row => {
        mockRealtime.emit(`${this.tableName}_changes`, {
          eventType: 'DELETE',
          new: {},
          old: { id: row.id }
        });
      });

      return { data: deletedRows, error: null };
    }

    return { data: null, error: 'Invalid action' };
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return this.execute().then(onfulfilled, onrejected);
  }
}

export const mockSupabaseClient = {
  from(tableName: string) {
    return new MockQueryBuilder(tableName);
  },
  auth: {
    async getSession() {
      if (typeof window === 'undefined') return { data: { session: null }, error: null };
      const sessStr = localStorage.getItem(MOCK_SESSION_KEY);
      if (!sessStr) return { data: { session: null }, error: null };
      return { data: { session: JSON.parse(sessStr) }, error: null };
    },
    async getUser() {
      if (typeof window === 'undefined') return { data: { user: null }, error: null };
      const sessStr = localStorage.getItem(MOCK_SESSION_KEY);
      if (!sessStr) return { data: { user: null }, error: null };
      const session = JSON.parse(sessStr);
      return { data: { user: session.user }, error: null };
    },
    async signUp({ email, password, options }: any) {
      if (typeof window === 'undefined') return { data: { user: null }, error: 'Window undefined' };
      const usersStr = localStorage.getItem(MOCK_USERS_KEY) || '[]';
      const users = JSON.parse(usersStr);
      if (users.some((u: any) => u.email === email)) {
        return { data: { user: null }, error: { message: 'User already exists' } };
      }

      const mockUserId = `user-${Math.random().toString(36).substr(2, 9)}`;
      const fullName = options?.data?.full_name || 'Mock User';
      const role = options?.data?.role || 'citizen';

      const newUser = {
        id: mockUserId,
        email,
        password,
        user_metadata: { full_name: fullName, role },
        role: 'authenticated'
      };

      users.push(newUser);
      localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));

      // Auto-insert profile into profiles table
      const profilesKey = `mock_profiles`;
      const profilesStr = localStorage.getItem(profilesKey) || '[]';
      const profiles = JSON.parse(profilesStr);
      const newProfile = {
        id: mockUserId,
        role: role,
        full_name: fullName,
        created_at: new Date().toISOString()
      };
      profiles.push(newProfile);
      localStorage.setItem(profilesKey, JSON.stringify(profiles));

      return { 
        data: { 
          user: { id: mockUserId, email, user_metadata: newUser.user_metadata } 
        }, 
        error: null 
      };
    },
    async signInWithPassword({ email, password }: any) {
      if (typeof window === 'undefined') return { data: { session: null }, error: 'Window undefined' };
      const usersStr = localStorage.getItem(MOCK_USERS_KEY) || '[]';
      const users = JSON.parse(usersStr);
      const user = users.find((u: any) => u.email === email && u.password === password);

      if (!user) {
        return { data: { session: null, user: null }, error: { message: 'Invalid login credentials' } };
      }

      const mockSession = {
        access_token: 'mock-jwt-token-123',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token-123',
        user: {
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata,
          role: 'authenticated'
        }
      };

      localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(mockSession));
      
      authListeners.forEach(cb => cb('SIGNED_IN', mockSession));

      return { data: mockSession, error: null };
    },
    async signOut() {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(MOCK_SESSION_KEY);
      }
      authListeners.forEach(cb => cb('SIGNED_OUT', null));
      return { error: null };
    },
    onAuthStateChange(callback: any) {
      authListeners.push(callback);
      if (typeof window !== 'undefined') {
        const sessStr = localStorage.getItem(MOCK_SESSION_KEY);
        const session = sessStr ? JSON.parse(sessStr) : null;
        callback(session ? 'INITIAL_SESSION' : 'SIGNED_OUT', session);
      }
      return {
        data: {
          subscription: {
            unsubscribe() {
              authListeners = authListeners.filter(cb => cb !== callback);
            }
          }
        }
      };
    }
  },
  channel(channelName: string) {
    const emitter = mockRealtime;
    let unsub: any = null;
    return {
      on(type: string, filter: any, callback: Function) {
        let eventName = 'incidents_changes';
        if (channelName.includes('alerts')) eventName = 'alerts_changes';
        else if (channelName.includes('shelters')) eventName = 'shelters_changes';
        else if (channelName.includes('resources')) eventName = 'resources_changes';
        
        unsub = emitter.on(eventName, (payload: any) => {
          callback(payload);
        });
        return this;
      },
      subscribe() {
        return {
          unsubscribe() {
            if (unsub) unsub();
          }
        };
      }
    };
  },
  removeChannel(channel: any) {
    if (channel && channel.unsubscribe) {
      channel.unsubscribe();
    }
  }
};
