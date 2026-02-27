/**
 * Persistência e Armazenamento Local
 * Gerencia cache, preferências e sessão do usuário
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  LAST_URL: '@oliva_last_url',
  USER_PREFERENCES: '@oliva_user_prefs',
  CACHE_TIMESTAMP: '@oliva_cache_ts',
};

class StorageManager {
  /**
   * Salva a última URL visitada para restauração
   */
  async saveLastUrl(url: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_URL, url);
    } catch (error) {
      console.warn('Failed to save last URL:', error);
    }
  }

  /**
   * Recupera a última URL visitada
   */
  async getLastUrl(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.LAST_URL);
    } catch (error) {
      console.warn('Failed to get last URL:', error);
      return null;
    }
  }

  /**
   * Salva preferências do usuário
   */
  async savePreferences(prefs: Record<string, any>): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PREFERENCES,
        JSON.stringify(prefs)
      );
    } catch (error) {
      console.warn('Failed to save preferences:', error);
    }
  }

  /**
   * Recupera preferências do usuário
   */
  async getPreferences(): Promise<Record<string, any>> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      return json ? JSON.parse(json) : {};
    } catch (error) {
      console.warn('Failed to get preferences:', error);
      return {};
    }
  }

  /**
   * Limpa todo armazenamento local (logout)
   */
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.LAST_URL,
        STORAGE_KEYS.USER_PREFERENCES,
        STORAGE_KEYS.CACHE_TIMESTAMP,
      ]);
    } catch (error) {
      console.warn('Failed to clear storage:', error);
    }
  }

  /**
   * Verifica integridade/expiração de cache
   */
  async isCacheValid(maxAgeMs: number = 3600000): Promise<boolean> {
    try {
      const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.CACHE_TIMESTAMP);
      if (!timestamp) return false;

      const cacheTime = parseInt(timestamp, 10);
      const now = Date.now();
      return now - cacheTime < maxAgeMs;
    } catch (error) {
      return false;
    }
  }

  /**
   * Atualiza timestamp de cache
   */
  async updateCacheTimestamp(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.CACHE_TIMESTAMP,
        Date.now().toString()
      );
    } catch (error) {
      console.warn('Failed to update cache timestamp:', error);
    }
  }
}

export const storageManager = new StorageManager();
