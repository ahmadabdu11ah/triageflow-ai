import apiClient, { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from './client';

export const DEMO_CREDENTIALS = {
  email: 'demo@triageflow.ai',
  full_name: 'Demo Triage Engineer',
  password: 'DemoPassword123!',
};

function persistSession(tokenResponse) {
  if (tokenResponse?.access_token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, tokenResponse.access_token);
  }
  if (tokenResponse?.user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(tokenResponse.user));
  }
  return tokenResponse;
}

/**
 * POST /api/auth/register
 * Request: UserCreate { email, full_name, password }
 * Response: Token { access_token, token_type, user: UserRead }
 */
export async function registerUser({ email, full_name, password }) {
  const { data } = await apiClient.post('/api/auth/register', {
    email: email.trim(),
    full_name: full_name.trim(),
    password,
  });
  return persistSession(data);
}

/**
 * POST /api/auth/login
 * Request: UserLogin { email, password }
 * Response: Token { access_token, token_type, user: UserRead }
 */
export async function loginUser({ email, password }) {
  const { data } = await apiClient.post('/api/auth/login', {
    email: email.trim(),
    password,
  });
  return persistSession(data);
}

/**
 * GET /api/auth/me
 * Response: UserRead { id, email, full_name, role, is_active, created_at }
 */
export async function getCurrentUser() {
  const { data } = await apiClient.get('/api/auth/me');
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
  return data;
}

/**
 * 1-Click Demo User Login:
 * Attempts POST /api/auth/login first; if the demo user has not been created yet (401/404),
 * automatically registers the demo account via POST /api/auth/register.
 */
export async function loginDemoUser({ onStatusChange } = {}) {
  onStatusChange?.('Signing in to demo account...');
  try {
    return await loginUser({
      email: DEMO_CREDENTIALS.email,
      password: DEMO_CREDENTIALS.password,
    });
  } catch (loginError) {
    const status = loginError.response?.status;
    if (status === 401 || status === 404) {
      onStatusChange?.('Provisioning demo account...');
      try {
        return await registerUser(DEMO_CREDENTIALS);
      } catch (registerError) {
        if (registerError.response?.status === 409) {
          return await loginUser({
            email: DEMO_CREDENTIALS.email,
            password: DEMO_CREDENTIALS.password,
          });
        }
        throw registerError;
      }
    }
    throw loginError;
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}
