// Legal & Compliance Module Types

export interface LegalDocument {
  id: string;
  org_id: string | null;
  document_type: 'terms' | 'privacy' | 'refund' | 'cookie' | 'gdpr';
  title: string;
  content: string;
  version: string;
  is_active: boolean;
  effective_date: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserConsentRecord {
  id: string;
  user_id: string;
  document_id: string;
  document_type: string;
  document_version: string;
  consent_given: boolean;
  consent_method: 'click' | 'checkbox' | 'signature';
  ip_address: string | null;
  user_agent: string | null;
  consented_at: string;
  withdrawn_at: string | null;
  withdrawal_reason: string | null;
}

export interface GDPRDataRequest {
  id: string;
  user_id: string;
  request_type: 'access' | 'export' | 'delete' | 'rectify';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requested_at: string;
  processed_at: string | null;
  processed_by: string | null;
  data_export_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CookiePreferences {
  id: string;
  user_id: string | null;
  session_id: string | null;
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  ip_address: string | null;
  created_at: string;
  updated_at: string;
}

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  terms: 'Terms & Conditions',
  privacy: 'Privacy Policy',
  refund: 'Refund Policy',
  cookie: 'Cookie Policy',
  gdpr: 'GDPR Policy'
};
