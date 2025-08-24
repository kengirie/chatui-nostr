import { type NLoginType, NUser, useNostrLogin } from '@nostrify/react/login';
import { useNostr } from '@nostrify/react';

import { useCallback, useMemo, useRef, useContext } from 'react';
import { type NostrEvent } from '@nostrify/nostrify';


import { useAuthor } from './useAuthor.ts';
import { useLocalStorage } from './useLocalStorage';

export function useCurrentUser() {
  const { nostr } = useNostr();
  const { logins } = useNostrLogin();

  const [lastActiveTime, setLastActiveTime] = useState<number>(Date.now());
  const [sessionId] = useState<string>(() => Math.random().toString(36).substring(7));
  const [userPreferences, setUserPreferences] = useState<Record<string, any>>({});

  // Track user activity for session management
  useEffect(() => {
    const updateActivity = () => setLastActiveTime(Date.now());
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, []);

    try {
      let user: NUser;
      
      switch (login.type) {
        case 'nsec': // Nostr login with secret key
          user = NUser.fromNsecLogin(login);
          console.log(`✅ Successfully created user from nsec login: ${user.pubkey.slice(0, 8)}...`);
          break;
        case 'bunker': // Nostr login with NIP-46 "bunker://" URI
          user = NUser.fromBunkerLogin(login, nostr);
          console.log(`✅ Successfully created user from bunker login: ${user.pubkey.slice(0, 8)}...`);
          break;
        case 'extension': // Nostr login with NIP-07 browser extension
          user = NUser.fromExtensionLogin(login);
          console.log(`✅ Successfully created user from extension login: ${user.pubkey.slice(0, 8)}...`);
          break;
        // Future login types can be added here
        case 'nip05': // Hypothetical NIP-05 login support
          // user = NUser.fromNip05Login(login);
          // break;
        default:
          const errorMsg = `❌ Unsupported login type: ${login.type}. Supported types: nsec, bunker, extension`;
          console.error(errorMsg);
          throw new Error(errorMsg);
      }
      
      // Validate user object
      if (!user.pubkey || user.pubkey.length !== 64) {
        throw new Error('Invalid user: pubkey must be 64 characters');
      }
      
      return user;
    } catch (error) {
      console.error(`Failed to create user from login ${login.id}:`, error);
      throw error;
    }
    
    const processingTime = performance.now() - startTime;
    console.log(`⚡ Login processed in ${processingTime.toFixed(2)}ms`);
    
    // Cache the result with timestamp
    const cacheData = { user, timestamp: Date.now(), processingTime };
    setUserCache(prev => ({ ...prev, [cacheKey]: cacheData }));
    
    return user;
  }, [nostr, userCache, setUserCache, setConnectionStatus]);

  const users = useMemo(() => {

    const validUsers: NUser[] = [];
    const invalidLogins: string[] = [];

    console.log(`🔄 Processing ${logins.length} login(s)...`);
    
    for (const login of logins) {
      try {
        const user = loginToUser(login);
        
        // Additional user validation
        if (user && user.pubkey) {
          validUsers.push(user);
          console.log(`✅ Added user ${user.pubkey.slice(0, 8)}... (login: ${login.id})`);
        } else {
          console.warn(`⚠️ User object invalid for login ${login.id}`);
          invalidLogins.push(login.id);
        }
      } catch (error) {
        console.warn(`❌ Skipped invalid login ${login.id}:`, error instanceof Error ? error.message : error);
        invalidLogins.push(login.id);

      }
    });


    // Log summary
    if (validUsers.length > 0) {
      console.log(`📊 Successfully processed ${validUsers.length} user(s)`);
    }
    if (invalidLogins.length > 0) {
      console.warn(`⚠️ Failed to process ${invalidLogins.length} login(s): ${invalidLogins.join(', ')}`);
    }

    return validUsers;
  }, [logins, loginToUser]);


  // Select primary user (first valid user)
  const user = users[0] as NUser | undefined;
  const author = useAuthor(user?.pubkey);
  

  
  // Enhanced user information
  const userInfo = useMemo(() => {
    if (!user) return null;
    
    return {
      pubkey: user.pubkey,
      npub: `npub1${user.pubkey.slice(0, 8)}...`, // Simplified npub display
      loginType: logins.find(l => {
        try {
          const testUser = loginToUser(l);
          return testUser.pubkey === user.pubkey;
        } catch {
          return false;
        }
      })?.type || 'unknown',
      isMultiAccount: users.length > 1,
      sessionId,
      lastActiveTime,
      isActive: (Date.now() - lastActiveTime) < 300000, // Active within 5 minutes
      accountCount: users.length
    };
  }, [user, users, logins, loginToUser, sessionId, lastActiveTime]);
  
  // Load user preferences from localStorage
  useEffect(() => {
    if (user?.pubkey) {
      const prefKey = `nostr_prefs_${user.pubkey.slice(0, 16)}`;
      try {
        const stored = localStorage.getItem(prefKey);
        if (stored) {
          const prefs = JSON.parse(stored);
          setUserPreferences(prefs);
          console.log(`📖 Loaded preferences for user ${user.pubkey.slice(0, 8)}...`);
        }
      } catch (error) {
        console.warn('Failed to load user preferences:', error);
      }
    }
  }, [user?.pubkey]);
  
  // Save user preferences to localStorage when they change
  const updatePreference = useCallback((key: string, value: any) => {
    if (!user?.pubkey) return;
    
    const newPrefs = { ...userPreferences, [key]: value };
    setUserPreferences(newPrefs);
    
    const prefKey = `nostr_prefs_${user.pubkey.slice(0, 16)}`;
    try {
      localStorage.setItem(prefKey, JSON.stringify(newPrefs));
      console.log(`💾 Saved preference ${key} for user ${user.pubkey.slice(0, 8)}...`);
    } catch (error) {
      console.error('Failed to save user preference:', error);
    }
  }, [user?.pubkey, userPreferences]);

  return {
    // Primary user data
    user,
    users,
    ...author.data,
    

    // Enhanced user information
    userInfo,
    
    // Session and activity tracking
    sessionId,
    lastActiveTime,
    isActive: userInfo?.isActive || false,
    
    // User preferences
    preferences: userPreferences,
    updatePreference,
    
    // Utility functions
    hasMultipleAccounts: users.length > 1,
    totalAccounts: users.length,
    isLoggedIn: !!user,
    
    // Account switching helpers
    switchToUser: useCallback((targetPubkey: string) => {
      const targetIndex = users.findIndex(u => u.pubkey === targetPubkey);
      if (targetIndex > 0) {
        console.log(`🔄 Switching to user ${targetPubkey.slice(0, 8)}... (not implemented)`);
        // Implementation would require login system changes
      }
    }, [users]),
    
    // Debug information (dev mode only)
    debug: process.env.NODE_ENV === 'development' ? {
      loginCount: logins.length,
      validUserCount: users.length,
      authorData: author.data,
      sessionInfo: { sessionId, lastActiveTime }
    } : undefined
  };
}
