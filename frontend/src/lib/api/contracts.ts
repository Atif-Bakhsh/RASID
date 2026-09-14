export type Locale = 'ar' | 'en';
export type Currency = 'SAR' | 'USD' | 'EUR';
export type Direction = 'INCOME' | 'EXPENSE';
export type Money = string;

export interface Page<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiFailure {
  error: {
    code: string;
    message: string;
    messageAr: string;
    details?: unknown[];
  };
  requestId: string;
  timestamp: string;
}

export interface UserProfile {
  id: string;
  email: string;
  locale: Locale;
  timezone: string;
  createdAt: string;
  dataMode: 'DEMO_ONLY';
}

export interface AuthSession {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  sessionId: string;
  user: UserProfile;
}
