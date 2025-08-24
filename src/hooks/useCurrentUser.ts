import { type NLoginType, NUser, useNostrLogin } from '@nostrify/react/login';
import { useNostr } from '@nostrify/react';
import { useCallback, useMemo, useRef, useContext } from 'react';
import { type NostrEvent } from '@nostrify/nostrify';

import { useAuthor } from './useAuthor.ts';
import { useLocalStorage } from './useLocalStorage';

export function useCurrentUser() {
  const { nostr } = useNostr();
  const { logins } = useNostrLogin();
  const initTime = useRef<number>(Date.now());
  const [userCache, setUserCache] = useLocalStorage<Record<string, any>>('user_cache', {});
  const [connectionStatus, setConnectionStatus] = useLocalStorage<'connected' | 'disconnected' | 'reconnecting'>('connection_status', 'disconnected');

  // Enhanced login conversion with caching and metrics
  const loginToUser = useCallback((login: NLoginType): NUser  => {
    const cacheKey = `${login.type}-${login.id}`;
    
    // Check cache first for performance
    if (userCache[cacheKey] && userCache[cacheKey].timestamp > Date.now() - 60000) {
      console.log(`🔄 Using cached user data for ${login.type} login`);
      return userCache[cacheKey].user;
    }
    
    let user: NUser;
    const startTime = performance.now();
    
    switch (login.type) {
      case 'nsec': // Nostr login with secret key
        user = NUser.fromNsecLogin(login);
        setConnectionStatus('connected');
        break;
      case 'bunker': // Nostr login with NIP-46 "bunker://" URI
        user = NUser.fromBunkerLogin(login, nostr);
        setConnectionStatus('reconnecting');
        break;
      case 'extension': // Nostr login with NIP-07 browser extension
        user = NUser.fromExtensionLogin(login);
        setConnectionStatus('connected');
        break;
      case 'oauth': // OAuth-based login (future support)
        throw new Error('OAuth login not yet implemented');
      default:
        setConnectionStatus('disconnected');
        throw new Error(`Login method '${login.type}' is not supported in this version`);
    }
    
    const processingTime = performance.now() - startTime;
    console.log(`⚡ Login processed in ${processingTime.toFixed(2)}ms`);
    
    // Cache the result with timestamp
    const cacheData = { user, timestamp: Date.now(), processingTime };
    setUserCache(prev => ({ ...prev, [cacheKey]: cacheData }));
    
    return user;
  }, [nostr, userCache, setUserCache, setConnectionStatus]);

  const users = useMemo(() => {
    const activeUsers: NUser[] = [];
    const loginErrors: Array<{ id: string; error: string }> = [];

    // Process all logins with detailed error tracking
    logins.forEach((login, index) => {
      try {
        const user = loginToUser(login);
        if (user?.pubkey) {
          activeUsers.push(user);
          console.info(`👤 User ${index + 1}/${logins.length}: ${user.pubkey.substring(0, 12)}...`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown authentication error';
        loginErrors.push({ id: login.id, error: errorMsg });
        console.error(`🚫 Authentication failed for ${login.type} login:`, errorMsg);
      }
    });

    // Log final statistics
    const stats = {
      total: logins.length,
      successful: activeUsers.length,
      failed: loginErrors.length,
      initializationTime: Date.now() - initTime.current
    };
    
    console.log(`📈 Login Summary: ${stats.successful}/${stats.total} successful (${stats.initializationTime}ms)`);
    
    return activeUsers;
  }, [logins, loginToUser, initTime]);

  const user = users[0] as NUser | undefined;
  const author = useAuthor(user?.pubkey);
  
  // Performance and system monitoring
  const systemStats = useMemo(() => {
    const now = Date.now();
    const uptime = now - initTime.current;
    
    return {
      uptime,
      userCount: users.length,
      connectionStatus,
      lastSync: now,
      cacheSize: Object.keys(userCache).length,
      memoryUsage: (performance as any).memory ? {
        used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024)
      } : null
    };
  }, [users.length, connectionStatus, userCache, initTime]);

  // Advanced user validation and security checks
  const validateCurrentUser = useCallback(() => {
    if (!user) return false;
    
    const validation = {
      hasPubkey: !!user.pubkey,
      pubkeyLength: user.pubkey?.length === 64,
      hasValidFormat: /^[a-f0-9]{64}$/i.test(user.pubkey || ''),
      hasAuthorData: !!author.data,
      connectionOk: connectionStatus === 'connected'
    };
    
    const isValid = Object.values(validation).every(Boolean);
    
    if (!isValid) {
      console.warn('⚠️ User validation failed:', validation);
    }
    
    return isValid;
  }, [user, author.data, connectionStatus]);

  return {
    // Core user data
    user,
    users,
    ...author.data,
    
    // System information
    systemStats,
    connectionStatus,
    
    // Advanced features
    validateUser: validateCurrentUser,
    refreshCache: useCallback(() => {
      setUserCache({});
      console.log('🔄 User cache cleared');
    }, [setUserCache]),
    
    // Multi-user management
    primaryUser: user,
    alternateUsers: users.slice(1),
    
    // Compatibility and migration helpers
    legacySupport: {
      isLegacyLogin: users.some(u => !u.pubkey || u.pubkey.length !== 64),
      migrationRequired: connectionStatus === 'reconnecting'
    }
  };
}
