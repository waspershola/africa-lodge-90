/**
 * OfflineService - Handles true offline functionality for front desk operations
 * 
 * Features:
 * - IndexedDB storage for offline data
 * - Action queue for offline operations
 * - Conflict resolution when coming back online
 * - Background sync when connection restored
 * - Service worker integration
 */

import { supabase } from '@/integrations/supabase/client';

export interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  recordId?: string;
  data: any;
  clientTimestamp: Date;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
}

export interface SyncResult {
  success: boolean;
  actionsProcessed: number;
  errors: string[];
}

class OfflineService {
  private db: IDBDatabase | null = null;
  private isOnline = navigator.onLine;
  private syncInProgress = false;
  private listeners: Map<string, Function[]> = new Map();
  private dbName = 'FrontDeskOfflineDB';
  private dbVersion = 1;

  constructor() {
    this.initializeDB();
    this.setupNetworkListeners();
    this.setupPeriodicSync();
  }

  private async initializeDB() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        console.log('OfflineService: IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create offline actions store
        if (!db.objectStoreNames.contains('offlineActions')) {
          const actionsStore = db.createObjectStore('offlineActions', { keyPath: 'id' });
          actionsStore.createIndex('status', 'status', { unique: false });
          actionsStore.createIndex('table', 'table', { unique: false });
          actionsStore.createIndex('timestamp', 'clientTimestamp', { unique: false });
        }

        // Create cached data store
        if (!db.objectStoreNames.contains('cachedData')) {
          const cachedStore = db.createObjectStore('cachedData', { keyPath: 'key' });
          cachedStore.createIndex('table', 'table', { unique: false });
          cachedStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
        }

        // Create settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        console.log('OfflineService: Database schema created');
      };
    });
  }

  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      console.log('OfflineService: Network online');
      this.isOnline = true;
      this.emit('connectionChange', { isOnline: true });
      this.syncPendingActions();
    });

    window.addEventListener('offline', () => {
      console.log('OfflineService: Network offline');
      this.isOnline = false;
      this.emit('connectionChange', { isOnline: false });
    });
  }

  private setupPeriodicSync() {
    // Sync every 30 seconds when online
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncPendingActions();
      }
    }, 30000);
  }

  public async queueAction(action: Omit<OfflineAction, 'id' | 'clientTimestamp' | 'retryCount' | 'status'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const actionId = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const offlineAction: OfflineAction = {
      id: actionId,
      clientTimestamp: new Date(),
      retryCount: 0,
      status: 'pending',
      ...action
    };

    const transaction = this.db.transaction(['offlineActions'], 'readwrite');
    const store = transaction.objectStore('offlineActions');
    
    await new Promise<void>((resolve, reject) => {
      const request = store.add(offlineAction);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log(`OfflineService: Queued action ${actionId}`, offlineAction);
    this.emit('actionQueued', offlineAction);

    // Try to sync immediately if online
    if (this.isOnline) {
      setTimeout(() => this.syncPendingActions(), 100);
    }

    return actionId;
  }

  public async getPendingActions(): Promise<OfflineAction[]> {
    if (!this.db) return [];

    const transaction = this.db.transaction(['offlineActions'], 'readonly');
    const store = transaction.objectStore('offlineActions');
    const index = store.index('status');

    return new Promise<OfflineAction[]>((resolve) => {
      const request = index.getAll('pending');
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  }

  public async getFailedActions(): Promise<OfflineAction[]> {
    if (!this.db) return [];

    const transaction = this.db.transaction(['offlineActions'], 'readonly');
    const store = transaction.objectStore('offlineActions');
    const index = store.index('status');

    return new Promise<OfflineAction[]>((resolve) => {
      const request = index.getAll('failed');
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  }

  public async syncPendingActions(): Promise<SyncResult> {
    if (!this.isOnline || this.syncInProgress || !this.db) {
      return { success: false, actionsProcessed: 0, errors: ['Sync conditions not met'] };
    }

    this.syncInProgress = true;
    this.emit('syncStarted', {});

    const pendingActions = await this.getPendingActions();
    const errors: string[] = [];
    let processed = 0;

    console.log(`OfflineService: Syncing ${pendingActions.length} pending actions`);

    for (const action of pendingActions) {
      try {
        await this.updateActionStatus(action.id, 'processing');
        
        const result = await this.executeAction(action);
        
        if (result.success) {
          await this.updateActionStatus(action.id, 'completed');
          processed++;
        } else {
          await this.handleActionFailure(action, result.error);
          errors.push(`Action ${action.id}: ${result.error}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await this.handleActionFailure(action, errorMessage);
        errors.push(`Action ${action.id}: ${errorMessage}`);
      }
    }

    this.syncInProgress = false;
    
    const syncResult = {
      success: errors.length === 0,
      actionsProcessed: processed,
      errors
    };

    this.emit('syncCompleted', syncResult);
    console.log('OfflineService: Sync completed', syncResult);

    return syncResult;
  }

  private async executeAction(action: OfflineAction): Promise<{ success: boolean; error?: string }> {
    try {
      switch (action.type) {
        case 'create':
          return await this.executeCreate(action);
        case 'update':
          return await this.executeUpdate(action);
        case 'delete':
          return await this.executeDelete(action);
        default:
          return { success: false, error: `Unknown action type: ${action.type}` };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private async executeCreate(action: OfflineAction): Promise<{ success: boolean; error?: string }> {
      const { error } = await supabase
        .from(action.table as any)
        .insert(action.data);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  private async executeUpdate(action: OfflineAction): Promise<{ success: boolean; error?: string }> {
    if (!action.recordId) {
      return { success: false, error: 'No record ID provided for update' };
    }

    const { error } = await supabase
      .from(action.table as any)
      .update(action.data)
      .eq('id', action.recordId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  private async executeDelete(action: OfflineAction): Promise<{ success: boolean; error?: string }> {
    if (!action.recordId) {
      return { success: false, error: 'No record ID provided for delete' };
    }

    const { error } = await supabase
      .from(action.table as any)
      .delete()
      .eq('id', action.recordId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  private async updateActionStatus(actionId: string, status: OfflineAction['status'], errorMessage?: string) {
    if (!this.db) return;

    const transaction = this.db.transaction(['offlineActions'], 'readwrite');
    const store = transaction.objectStore('offlineActions');

    const getRequest = store.get(actionId);
    getRequest.onsuccess = () => {
      const action = getRequest.result;
      if (action) {
        action.status = status;
        if (errorMessage) action.errorMessage = errorMessage;
        store.put(action);
      }
    };
  }

  private async handleActionFailure(action: OfflineAction, errorMessage: string) {
    action.retryCount++;
    
    if (action.retryCount >= action.maxRetries) {
      await this.updateActionStatus(action.id, 'failed', errorMessage);
      this.emit('actionFailed', { action, error: errorMessage });
    } else {
      await this.updateActionStatus(action.id, 'pending', errorMessage);
      this.emit('actionRetry', { action, error: errorMessage });
    }
  }

  // Caching methods
  public async cacheData(key: string, data: any, table: string) {
    if (!this.db) return;

    const cacheEntry = {
      key,
      data,
      table,
      lastUpdated: new Date()
    };

    const transaction = this.db.transaction(['cachedData'], 'readwrite');
    const store = transaction.objectStore('cachedData');
    store.put(cacheEntry);
  }

  public async getCachedData(key: string): Promise<any | null> {
    if (!this.db) return null;

    const transaction = this.db.transaction(['cachedData'], 'readonly');
    const store = transaction.objectStore('cachedData');

    return new Promise((resolve) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
      request.onerror = () => resolve(null);
    });
  }

  public async clearCache() {
    if (!this.db) return;

    const transaction = this.db.transaction(['cachedData'], 'readwrite');
    const store = transaction.objectStore('cachedData');
    await store.clear();
  }

  // Quick action helpers for common front desk operations
  public async queueCheckIn(guestData: any, roomId: string) {
    return this.queueAction({
      type: 'create',
      table: 'reservations',
      data: {
        ...guestData,
        room_id: roomId,
        status: 'checked_in',
        check_in_date: new Date().toISOString()
      },
      maxRetries: 3
    });
  }

  public async queueCheckOut(reservationId: string) {
    return this.queueAction({
      type: 'update',
      table: 'reservations',
      recordId: reservationId,
      data: {
        status: 'checked_out',
        check_out_date: new Date().toISOString()
      },
      maxRetries: 3
    });
  }

  public async queuePayment(folioId: string, paymentData: any) {
    return this.queueAction({
      type: 'create',
      table: 'payments',
      data: {
        folio_id: folioId,
        ...paymentData,
        status: 'completed',
        created_at: new Date().toISOString()
      },
      maxRetries: 5 // Higher retry for payments
    });
  }

  public async queueMaintenanceRequest(roomId: string, requestData: any) {
    return this.queueAction({
      type: 'create',
      table: 'housekeeping_tasks',
      data: {
        room_id: roomId,
        task_type: 'maintenance',
        ...requestData,
        status: 'pending',
        created_at: new Date().toISOString()
      },
      maxRetries: 3
    });
  }

  // Event system
  public on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public off(event: string, callback: Function) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Status methods
  public getConnectionStatus() {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress
    };
  }

  public async getStats() {
    const pending = await this.getPendingActions();
    const failed = await this.getFailedActions();

    return {
      pendingActions: pending.length,
      failedActions: failed.length,
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress
    };
  }
}

// Export singleton instance
export const offlineService = new OfflineService();
export default offlineService;