export type UserRole = 'ADMIN' | 'MANUFACTURER' | 'BUYER';
export type AccountStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED';

export type Profile = {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  company_name: string;
  phone: string | null;
  country: string | null;
  website: string | null;
  status: AccountStatus;
  plan?: string | null;
  billing_cycle?: 'MONTHLY' | 'YEARLY' | 'CUSTOM' | string | null;
  subscription_status?: string | null;
  success_fee_pct?: number | null;
  plan_started_at?: string | null;
  plan_renews_at?: string | null;
  onboarding_completed?: boolean;
  onboarding_step?: number;
  business_type?: string | null;
  preferred_categories?: string[];
  preferred_countries?: string[];
  annual_purchase_volume?: string | null;
  sourcing_notes?: string | null;
  notification_email?: boolean;
  notification_in_app?: boolean;
  created_at: string;
  updated_at: string;
};

export type AuthUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

export type AppSession = {
  user: AuthUser;
  profile: Profile;
  accessToken: string;
};
