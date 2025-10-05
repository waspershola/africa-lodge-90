import Dexie, { Table } from 'dexie';

export interface OfflineRequest {
  id: string;
  sessionId: string;
  requestType: string;
  requestData: any;
  priority: string;
  createdAt: number;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
  lastError?: string;
}

export interface CachedSession {
  session_id: string;
  tenant_id: string;
  qr_code_id: string;
  hotel_name: string;
  room_number: string;
  services: string[];
  expires_at: string;
  cached_at: number;
}

export interface CachedMenu {
  tenant_id: string;
  menu_id: string;
  menu_data: any;
  cached_at: number;
}

class OfflineDatabase extends Dexie {
  requests!: Table<OfflineRequest, string>;
  sessions!: Table<CachedSession, string>;
  menus!: Table<CachedMenu, string>;

  constructor() {
    super('GuestPortalOffline');
    
    this.version(1).stores({
      requests: 'id, sessionId, syncStatus, createdAt',
      sessions: 'session_id, tenant_id, cached_at',
      menus: 'menu_id, tenant_id, cached_at'
    });
  }

  async addOfflineRequest(request: Omit<OfflineRequest, 'id' | 'createdAt' | 'syncStatus' | 'retryCount'>) {
    const offlineRequest: OfflineRequest = {
      id: crypto.randomUUID(),
      ...request,
      createdAt: Date.now(),
      syncStatus: 'pending',
      retryCount: 0
    };

    await this.requests.add(offlineRequest);
    return offlineRequest;
  }

  async getPendingRequests(): Promise<OfflineRequest[]> {
    return await this.requests
      .where('syncStatus')
      .equals('pending')
      .or('syncStatus')
      .equals('failed')
      .toArray();
  }

  async markRequestSynced(id: string) {
    await this.requests.update(id, {
      syncStatus: 'synced',
      lastError: undefined
    });
  }

  async markRequestFailed(id: string, error: string) {
    const request = await this.requests.get(id);
    if (request) {
      await this.requests.update(id, {
        syncStatus: 'failed',
        retryCount: request.retryCount + 1,
        lastError: error
      });
    }
  }

  async cacheSession(session: Omit<CachedSession, 'cached_at'>) {
    await this.sessions.put({
      ...session,
      cached_at: Date.now()
    });
  }

  async getCachedSession(sessionId: string): Promise<CachedSession | undefined> {
    return await this.sessions.get(sessionId);
  }

  async cacheMenu(menu: Omit<CachedMenu, 'cached_at'>) {
    await this.menus.put({
      ...menu,
      cached_at: Date.now()
    });
  }

  async getCachedMenu(menuId: string): Promise<CachedMenu | undefined> {
    return await this.menus.get(menuId);
  }

  async clearOldCache(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000) {
    const cutoff = Date.now() - maxAgeMs;
    
    await this.sessions.where('cached_at').below(cutoff).delete();
    await this.menus.where('cached_at').below(cutoff).delete();
    await this.requests.where('syncStatus').equals('synced').and(req => req.createdAt < cutoff).delete();
  }
}

export const offlineDB = new OfflineDatabase();
