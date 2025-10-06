import Dexie, { Table } from 'dexie';

// Schema version - increment when making breaking changes to clear stale cache
const SCHEMA_VERSION = 2;
const SCHEMA_VERSION_KEY = 'offlineDB_schema_version';

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
    
    // Version 2: Added schema versioning for cache invalidation
    this.version(2).stores({
      requests: 'id, sessionId, syncStatus, createdAt',
      sessions: 'session_id, tenant_id, cached_at',
      menus: 'menu_id, tenant_id, cached_at'
    });

    // Check schema version and clear cache if outdated
    this.on('ready', async () => {
      await this.checkAndClearStaleCache();
    });
  }

  /**
   * Check schema version and clear cache if it has changed
   * This ensures stale IndexedDB data doesn't persist across deployments
   */
  async checkAndClearStaleCache() {
    try {
      const storedVersion = localStorage.getItem(SCHEMA_VERSION_KEY);
      const storedVersionNum = storedVersion ? parseInt(storedVersion, 10) : 0;

      if (storedVersionNum !== SCHEMA_VERSION) {
        console.log(`[OfflineDB] Schema version mismatch (stored: ${storedVersionNum}, current: ${SCHEMA_VERSION}). Clearing cache...`);
        
        // Clear all tables
        await Promise.all([
          this.sessions.clear(),
          this.menus.clear(),
          this.requests.where('syncStatus').equals('synced').delete() // Keep pending requests
        ]);

        // Update stored version
        localStorage.setItem(SCHEMA_VERSION_KEY, SCHEMA_VERSION.toString());
        console.log('[OfflineDB] Cache cleared and schema version updated');
      }
    } catch (error) {
      console.error('[OfflineDB] Error checking schema version:', error);
    }
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

  /**
   * Force clear all cache (useful for debugging or emergency reset)
   */
  async forceClearCache() {
    console.log('[OfflineDB] Force clearing all cache...');
    await Promise.all([
      this.sessions.clear(),
      this.menus.clear(),
      this.requests.clear()
    ]);
    localStorage.removeItem(SCHEMA_VERSION_KEY);
    console.log('[OfflineDB] All cache cleared');
  }
}

export const offlineDB = new OfflineDatabase();
