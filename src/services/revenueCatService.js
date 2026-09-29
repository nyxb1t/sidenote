import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

let currentAppUserId = null;
let isInitialized = false;

/**
 * Extracts the authenticated Supabase user UUID from AsyncStorage or JWT payload.
 */
export const getStoredUserId = async () => {
  try {
    const directId = await AsyncStorage.getItem('supabase_user_id');
    if (directId) return directId;

    const token = await AsyncStorage.getItem('supabase_token');
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length === 3) {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const parsed = JSON.parse(jsonPayload);
      if (parsed?.sub) {
        await AsyncStorage.setItem('supabase_user_id', parsed.sub);
        return parsed.sub;
      }
    }
  } catch (err) {
    console.warn('[RevenueCat] Could not extract stored user ID:', err);
  }
  return null;
};

/**
 * Initializes RevenueCat using stored credentials if an active user session exists.
 */
export const initRevenueCatFromStorage = async () => {
  const userId = await getStoredUserId();
  if (userId) {
    return await initializeRevenueCat(userId);
  }
  return false;
};

/**
 * Returns the platform-specific RevenueCat API key from environment variables.
 */
export const getRevenueCatApiKey = () => {
  if (Platform.OS === 'android') {
    return process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY || null;
  }
  if (Platform.OS === 'ios') {
    return process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY || null;
  }
  return null;
};

/**
 * Check whether RevenueCat is ready for purchases.
 */
export const isRevenueCatConfigured = () => {
  return isInitialized && Boolean(getRevenueCatApiKey());
};

/**
 * Initialize RevenueCat with the authenticated Supabase user ID.
 * Must only be called after user authentication with a valid Supabase UUID.
 */
export const initializeRevenueCat = async (userId) => {
  if (!userId || typeof userId !== 'string') {
    console.warn('[RevenueCat] initializeRevenueCat called without a valid userId.');
    return false;
  }

  const apiKey = getRevenueCatApiKey();
  if (!apiKey) {
    console.warn(
      `[RevenueCat] API key not configured for platform ${Platform.OS}. In-app purchases will be unavailable in development.`
    );
    return false;
  }

  try {
    if (isInitialized && currentAppUserId === userId) {
      return true;
    }

    if (isInitialized && currentAppUserId && currentAppUserId !== userId) {
      // User switched account
      const { customerInfo } = await Purchases.logIn(userId);
      currentAppUserId = userId;
      return true;
    }

    if (__DEV__) {
      await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    await Purchases.configure({
      apiKey,
      appUserID: userId,
    });

    currentAppUserId = userId;
    isInitialized = true;
    return true;
  } catch (err) {
    console.error('[RevenueCat] Failed to configure Purchases SDK:', err);
    return false;
  }
};

/**
 * Handles logout: resets user session in RevenueCat so subsequent actions
 * are not attributed to the previous user.
 */
export const logoutRevenueCat = async () => {
  if (!isInitialized) return;
  try {
    const isAnon = await Purchases.isAnonymous();
    if (!isAnon) {
      await Purchases.logOut();
    }
    currentAppUserId = null;
  } catch (err) {
    console.warn('[RevenueCat] Error during logout:', err);
  }
};

/**
 * Fetch latest customer info from RevenueCat.
 */
export const getCustomerInfo = async () => {
  if (!isRevenueCatConfigured()) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch (err) {
    console.warn('[RevenueCat] Error fetching customer info:', err);
    return null;
  }
};

/**
 * Fetch available offerings and packages from RevenueCat.
 */
export const getOfferings = async () => {
  if (!isRevenueCatConfigured()) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings;
  } catch (err) {
    console.warn('[RevenueCat] Error fetching offerings:', err);
    return null;
  }
};

/**
 * Maps a RevenueCat package or product to our canonical backend plan ('basic', 'pro', 'advanced').
 * Explicitly ignores and rejects 'mastery' or unknown plans.
 */
export const mapPackageToPlan = (pkg) => {
  if (!pkg) return null;
  const idStr = `${pkg.identifier || ''} ${pkg.product?.identifier || ''}`.toLowerCase();

  if (/(^|[^a-z])advanced([^a-z]|$)/i.test(idStr)) return 'advanced';
  if (/(^|[^a-z])pro([^a-z]|$)/i.test(idStr)) return 'pro';
  if (/(^|[^a-z])basic([^a-z]|$)/i.test(idStr)) return 'basic';

  return null;
};

/**
 * Purchases a RevenueCat package.
 * Returns { success: boolean, customerInfo, userCancelled: boolean, error: string|null }
 */
export const purchasePackage = async (pkg) => {
  if (!isRevenueCatConfigured()) {
    return {
      success: false,
      userCancelled: false,
      error: 'Purchases are currently unavailable (missing RevenueCat configuration).',
    };
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return {
      success: true,
      customerInfo,
      userCancelled: false,
      error: null,
    };
  } catch (err) {
    if (err.userCancelled) {
      return {
        success: false,
        userCancelled: true,
        error: null,
      };
    }
    console.error('[RevenueCat] Purchase failed:', err);
    return {
      success: false,
      userCancelled: false,
      error: err.message || 'Purchase failed. Please try again.',
    };
  }
};

/**
 * Restores previous purchases for the current user.
 * Returns { success: boolean, customerInfo, error: string|null }
 */
export const restorePurchases = async () => {
  if (!isRevenueCatConfigured()) {
    return {
      success: false,
      customerInfo: null,
      error: 'Purchases are currently unavailable.',
    };
  }

  try {
    const customerInfo = await Purchases.restorePurchases();
    return {
      success: true,
      customerInfo,
      error: null,
    };
  } catch (err) {
    console.error('[RevenueCat] Restore purchases failed:', err);
    return {
      success: false,
      customerInfo: null,
      error: err.message || 'Unable to restore purchases.',
    };
  }
};
