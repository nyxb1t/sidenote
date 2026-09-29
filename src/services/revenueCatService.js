import { Platform } from 'react-native';

// NOTE: react-native-purchases is NOT installed by default. 
// For this to work in the real build, you MUST install it via:
// npx expo install react-native-purchases
// Since the prompt instructs to keep it safe for demo mode, this scaffold will gracefully fail if not installed.

let Purchases = null;
try {
  Purchases = require('react-native-purchases').default;
} catch (e) {
  console.warn('react-native-purchases not found. Demo mode fallback active.');
}

const API_KEYS = {
  ios: 'YOUR_REVENUECAT_APPLE_KEY', // e.g. appl_xxxx
  android: 'YOUR_REVENUECAT_GOOGLE_KEY' // e.g. goog_xxxx
};

// Map RevenueCat Entitlement IDs to internal plans
export const ENTITLEMENT_ID = 'pro_access'; 

export const PLANS = {
  FREE: 'free',
  BASIC: 'basic',
  PRO: 'pro',
  ADVANCED: 'advanced'
};

export const initializeRevenueCat = async () => {
  if (!Purchases) return false;
  try {
    if (Platform.OS === 'ios') {
      await Purchases.configure({ apiKey: API_KEYS.ios });
    } else if (Platform.OS === 'android') {
      await Purchases.configure({ apiKey: API_KEYS.android });
    }
    return true;
  } catch (e) {
    console.warn('RevenueCat Init Error:', e);
    return false;
  }
};

export const getCustomerInfo = async () => {
  if (!Purchases) return { activePlan: PLANS.FREE, isMock: true };
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return parseCustomerInfo(customerInfo);
  } catch (e) {
    console.warn('RevenueCat getCustomerInfo Error:', e);
    return { activePlan: PLANS.FREE, isMock: true };
  }
};

export const purchasePackage = async (rcPackage) => {
  if (!Purchases) return { success: false, error: 'Not installed in demo' };
  try {
    const { customerInfo } = await Purchases.purchasePackage(rcPackage);
    return { success: true, info: parseCustomerInfo(customerInfo) };
  } catch (e) {
    console.warn('RevenueCat Purchase Error:', e);
    return { success: false, error: e.message };
  }
};

export const restorePurchases = async () => {
  if (!Purchases) return { success: false, error: 'Not installed in demo' };
  try {
    const customerInfo = await Purchases.restorePurchases();
    return { success: true, info: parseCustomerInfo(customerInfo) };
  } catch (e) {
    console.warn('RevenueCat Restore Error:', e);
    return { success: false, error: e.message };
  }
};

const parseCustomerInfo = (customerInfo) => {
  // If no entitlement, they are free
  if (!customerInfo || !customerInfo.entitlements.active[ENTITLEMENT_ID]) {
    return { activePlan: PLANS.FREE, isMock: false };
  }
  
  // They have the entitlement. Figure out which plan based on productIdentifier
  const activeEntitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
  const prodId = activeEntitlement.productIdentifier;
  
  let plan = PLANS.PRO; // fallback
  if (prodId.includes('basic')) plan = PLANS.BASIC;
  if (prodId.includes('pro')) plan = PLANS.PRO;
  if (prodId.includes('advanced')) plan = PLANS.ADVANCED;

  return { activePlan: plan, isMock: false };
};
