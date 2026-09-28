import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000');

const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('supabase_token');
    return token;
  } catch {
    return null;
  }
};

const _fetch = async (endpoint, method = 'GET', bodyData = null, requiresAuth = true) => {
  const token = await getAuthToken();
  if (requiresAuth && !token) {
    throw new Error('Not authenticated. Please sign in.');
  }

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
  if (bodyData && method !== 'GET') {
    options.body = JSON.stringify(bodyData);
  }

  const res = await fetch(`${API_URL}${endpoint}`, options);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.error?.message || errorData.message || `Request failed with status ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.code = errorData.error?.code || errorData.code;
    throw err;
  }

  return await res.json();
};

/**
 * Retrieves the current authenticated user's authoritative entitlement details:
 * plan, creditsRemaining, creditsUsed, resetAt, monthlyUsage, and limits.
 */
export const getMyEntitlements = async () => {
  const res = await _fetch('/v1/subscriptions/me', 'GET', null, true);
  return res.data || res;
};

/**
 * Retrieves the public plan definitions and capability limits.
 * Unauthenticated.
 */
export const getPlans = async () => {
  const res = await _fetch('/v1/subscriptions/plans', 'GET', null, false);
  return res.data || res;
};

/**
 * Triggers backend entitlement synchronization.
 * Authoritative: the client sends no plan or credits payload.
 */
export const syncEntitlements = async () => {
  const res = await _fetch('/v1/subscriptions/sync', 'POST', {}, true);
  return res.data || res;
};
