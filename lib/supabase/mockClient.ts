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
            status: "Pending",
            created_by: "system-user-id",
            created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
            assigned_resources: [],
            assigned_rescue_teams: []
          },
          {
            id: "inc-2",
            title: "Tambaram Power Grid Outage",
            category: "Power Outage",
            description: "Substation transformer explosion has cut off power to over 5,000 households.",
            location_name: "Tambaram West Depot",
            latitude: 12.9249,
            longitude: 80.1011,
            status: "In Progress",
            created_by: "system-user-id",
            created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
            assigned_resources: [],
            assigned_rescue_teams: []
          },
          {
            id: "inc-3",
            title: "T Nagar Industrial Fire",
            category: "Fire",
            description: "Minor electric short circuit fire at chemical storage warehouse.",
            location_name: "T Nagar Industrial Block",
            latitude: 13.0418,
            longitude: 80.2341,
            status: "Resolved",
            created_by: "system-user-id",
            created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
            assigned_resources: [],
            assigned_rescue_teams: []
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
            location: "Velachery Main Rd",
            latitude: 12.9790,
            longitude: 80.2210,
            capacity: 500,
            occupied: 320,
            status: "Active",
            contact: "+91 98765 43210",
            created_at: new Date(Date.now() - 3600000 * 5).toISOString()
          },
          {
            id: "sh-2",
            name: "Bandra Public Shelter Hall",
            address: "Bandra Reclamation Center, Mumbai",
            location: "Bandra",
            latitude: 19.0544,
            longitude: 72.8402,
            capacity: 350,
            occupied: 110,
            status: "Active",
            contact: "+91 22 2644 1122",
            created_at: new Date(Date.now() - 3600000 * 10).toISOString()
          },
          {
            id: "sh-3",
            name: "Connaught Place Emergency Pavilion",
            address: "CP Block B Central Stadium, New Delhi",
            location: "Connaught Place",
            latitude: 28.6304,
            longitude: 77.2177,
            capacity: 500,
            occupied: 500,
            status: "Full",
            contact: "+91 11 2341 9988",
            created_at: new Date(Date.now() - 3600000 * 20).toISOString()
          },
          {
            id: "sh-4",
            name: "Indiranagar Urban Camp Site",
            address: "100 Feet Road Municipal Gym, Bangalore",
            location: "Indiranagar",
            latitude: 12.9719,
            longitude: 77.6412,
            capacity: 200,
            occupied: 0,
            status: "Closed",
            contact: "+91 80 2521 3344",
            created_at: new Date(Date.now() - 3600000 * 30).toISOString()
          },
          {
            id: "sh-5",
            name: "Begumpet Disaster Relief Block",
            address: "Prakash Nagar Colony, Begumpet",
            location: "Begumpet",
            latitude: 17.4411,
            longitude: 78.4722,
            capacity: 300,
            occupied: 180,
            status: "Active",
            contact: "+91 40 2790 7788",
            created_at: new Date(Date.now() - 3600000 * 5).toISOString()
          },
          {
            id: "sh-6",
            name: "Salt Lake Municipal Center",
            address: "Salt Lake Sector V, Kolkata",
            location: "Salt Lake",
            latitude: 22.5733,
            longitude: 88.4311,
            capacity: 250,
            occupied: 60,
            status: "Active",
            contact: "+91 33 2358 1122",
            created_at: new Date(Date.now() - 3600000 * 10).toISOString()
          },
          {
            id: "sh-7",
            name: "Madurai Central Relief Hall",
            address: "22 West Masi Street, Madurai",
            location: "Madurai",
            latitude: 9.9252,
            longitude: 78.1198,
            capacity: 350,
            occupied: 120,
            status: "Active",
            contact: "+91 452 234 5678",
            created_at: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: "sh-8",
            name: "Madurai North Safe Shelter",
            address: "Goripalayam Main Rd, Madurai",
            location: "Madurai",
            latitude: 9.9360,
            longitude: 78.1280,
            capacity: 200,
            occupied: 190,
            status: "Active",
            contact: "+91 452 234 9900",
            created_at: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: "sh-9",
            name: "Chennai South Shelter Block",
            address: "Adyar Canal Rd, Chennai",
            location: "Chennai",
            latitude: 13.0060,
            longitude: 80.2500,
            capacity: 450,
            occupied: 410,
            status: "Active",
            contact: "+91 44 2444 8899",
            created_at: new Date(Date.now() - 3600000).toISOString()
          }
        ];
      } else if (this.tableName === 'resources') {
        initialData = [
          {
            id: "res-1",
            name: "Chennai Rescue Squad 1",
            type: "Rescue Team",
            location: "Velachery Depot",
            latitude: 12.9792,
            longitude: 80.2242,
            capacity: 10,
            contact: "+91 94440 12345",
            status: "Available",
            created_at: new Date(Date.now() - 3600000 * 2).toISOString()
          },
          {
            id: "res-2",
            name: "Chennai Water Tanker W-1",
            type: "Water Tanker",
            location: "Guindy Storage Hub",
            latitude: 13.0075,
            longitude: 80.2212,
            capacity: 12000,
            contact: "+91 94440 67890",
            status: "Available",
            created_at: new Date(Date.now() - 3600000 * 5).toISOString()
          },
          {
            id: "res-3",
            name: "Chennai Ambulance Unit A",
            type: "Ambulance",
            location: "Adyar Hospital Yard",
            latitude: 13.0018,
            longitude: 80.2580,
            capacity: 2,
            contact: "+91 94440 55555",
            status: "Deployed",
            created_at: new Date(Date.now() - 3600000 * 12).toISOString()
          },
          {
            id: "res-4",
            name: "Mumbai Emergency Water Squad",
            type: "Water Tanker",
            location: "Bandra Station Yard",
            latitude: 19.0550,
            longitude: 72.8420,
            capacity: 10000,
            contact: "+91 98200 11111",
            status: "Available",
            created_at: new Date(Date.now() - 3600000 * 18).toISOString()
          },
          {
            id: "res-5",
            name: "Mumbai Medical Rapid Unit",
            type: "Medical Team",
            location: "Kurla Medical Depot",
            latitude: 19.0712,
            longitude: 72.8790,
            capacity: 8,
            contact: "+91 98200 22222",
            status: "Deployed",
            created_at: new Date(Date.now() - 3600000 * 24).toISOString()
          },
          {
            id: "res-6",
            name: "Delhi Anti-Smog Water Sprinkler",
            type: "Water Tanker",
            location: "CP Fire Station",
            latitude: 28.6310,
            longitude: 77.2185,
            capacity: 15000,
            contact: "+91 98110 33333",
            status: "Available",
            created_at: new Date(Date.now() - 3600000 * 36).toISOString()
          },
          {
            id: "res-7",
            name: "Delhi Fire Service Unit D",
            type: "Fire Service",
            location: "Connaught Place Annex",
            latitude: 28.6322,
            longitude: 77.2198,
            capacity: 6,
            contact: "+91 98110 44444",
            status: "Available",
            created_at: new Date(Date.now() - 3600000 * 48).toISOString()
          },
          {
            id: "res-8",
            name: "Bangalore Relief Squad B",
            type: "Relief Camp",
            location: "Indiranagar Municipal Hall",
            latitude: 12.9725,
            longitude: 77.6420,
            capacity: 100,
            contact: "+91 98450 55555",
            status: "Available",
            created_at: new Date(Date.now() - 3600000 * 60).toISOString()
          },
          {
            id: "res-9",
            name: "Hyderabad Flood Evac Unit",
            type: "Rescue Team",
            location: "Begumpet Cantonment",
            latitude: 17.4425,
            longitude: 78.4735,
            capacity: 12,
            contact: "+91 98480 66666",
            status: "Available",
            created_at: new Date(Date.now() - 3600000 * 72).toISOString()
          },
          {
            id: "res-10",
            name: "Kolkata Ambulatory Care K",
            type: "Ambulance",
            location: "Salt Lake General Hospital",
            latitude: 22.5745,
            longitude: 88.4325,
            capacity: 3,
            contact: "+91 98300 77777",
            status: "Available",
            created_at: new Date(Date.now() - 3600000 * 84).toISOString()
          },
          {
            id: "res-11",
            name: "Chennai Food Pack Unit A",
            type: "Food",
            location: "Guindy Municipal Ground",
            latitude: 13.0070,
            longitude: 80.2210,
            status: "Available",
            capacity: 2000,
            contact: "+91 94440 11112",
            created_at: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: "res-12",
            name: "Chennai Emergency Water Tanker 2",
            type: "Water",
            location: "Velachery Depot",
            latitude: 12.9805,
            longitude: 80.2235,
            status: "Available",
            capacity: 15000,
            contact: "+91 94440 22223",
            created_at: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: "res-13",
            name: "Chennai Medical Kit Depot",
            type: "Medical Kits",
            location: "Velachery Main Rd",
            latitude: 12.9795,
            longitude: 80.2215,
            status: "Available",
            capacity: 500,
            contact: "+91 94440 33334",
            created_at: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: "res-14",
            name: "Chennai Coastal Rescue Boats",
            type: "Rescue Boats",
            location: "Adyar River Depot",
            latitude: 13.0020,
            longitude: 80.2570,
            status: "Available",
            capacity: 12,
            contact: "+91 94440 44445",
            created_at: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: "res-15",
            name: "Chennai Emergency Blanket Supply",
            type: "Blankets",
            location: "Tambaram West",
            latitude: 12.9265,
            longitude: 80.1010,
            status: "Available",
            capacity: 1000,
            contact: "+91 94440 55556",
            created_at: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: "res-16",
            name: "Velachery General Hospital",
            type: "Hospital",
            location: "Velachery Road, Chennai",
            latitude: 12.9790,
            longitude: 80.2210,
            status: "Available",
            capacity: 150,
            contact: "+91 44 2244 0001",
            created_at: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: "res-17",
            name: "Adyar Mission Hospital",
            type: "Hospital",
            location: "Lattice Bridge Rd, Adyar, Chennai",
            latitude: 13.0030,
            longitude: 80.2520,
            status: "Available",
            capacity: 80,
            contact: "+91 44 2444 0002",
            created_at: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: "res-18",
            name: "Madurai Food Distribution Hub",
            type: "Food",
            location: "Goripalayam Main Ground, Madurai",
            latitude: 9.9365,
            longitude: 78.1285,
            status: "Available",
            capacity: 1500,
            contact: "+91 95550 11111",
            created_at: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: "res-19",
            name: "Madurai Emergency Water Tanker",
            type: "Water",
            location: "West Masi Depot, Madurai",
            latitude: 9.9255,
            longitude: 78.1205,
            status: "Available",
            capacity: 10000,
            contact: "+91 95550 22222",
            created_at: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: "res-20",
            name: "Madurai Disaster Medical Kits",
            type: "Medical Kits",
            location: "Mission Hospital Rd, Madurai",
            latitude: 9.9285,
            longitude: 78.1235,
            status: "Available",
            capacity: 400,
            contact: "+91 95550 33333",
            created_at: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: "res-21",
            name: "Madurai Rescue Boat Unit",
            type: "Rescue Boats",
            location: "Vaigai River Bank, Madurai",
            latitude: 9.9320,
            longitude: 78.1250,
            status: "Available",
            capacity: 8,
            contact: "+91 95550 44444",
            created_at: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: "res-22",
            name: "Madurai Emergency Ambulance",
            type: "Ambulance",
            location: "Madurai Government Hospital",
            latitude: 9.9250,
            longitude: 78.1190,
            status: "Available",
            capacity: 4,
            contact: "+91 95550 55555",
            created_at: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: "res-23",
            name: "Madurai Government Hospital",
            type: "Hospital",
            location: "Goripalayam Rd, Madurai",
            latitude: 9.9355,
            longitude: 78.1275,
            status: "Available",
            capacity: 200,
            contact: "+91 452 234 1111",
            created_at: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: "res-24",
            name: "Madurai Medical Camp Vaigai",
            type: "Medical Camp",
            location: "Sellur, Madurai",
            latitude: 9.9400,
            longitude: 78.1220,
            status: "Available",
            capacity: 50,
            contact: "+91 452 234 2222",
            created_at: new Date(Date.now() - 3600000).toISOString()
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
