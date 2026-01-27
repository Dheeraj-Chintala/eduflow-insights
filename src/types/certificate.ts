import type { Course, Profile } from './database';

export type CertificateType = 'course' | 'internship' | 'experience' | 'lor';
export type LorStatus = 'draft' | 'issued' | 'revoked';

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  enrollment_id: string | null;
  certificate_number: string;
  certificate_type: CertificateType;
  template_id: string | null;
  qr_code_data: string | null;
  verification_url: string | null;
  recipient_name: string | null;
  recipient_email: string | null;
  course_duration: string | null;
  start_date: string | null;
  end_date: string | null;
  issued_by: string | null;
  authorized_signature_url: string | null;
  is_revoked: boolean;
  revoked_at: string | null;
  revoked_reason: string | null;
  additional_data: Record<string, unknown>;
  issued_at: string;
  expires_at: string | null;
  pdf_url: string | null;
  created_at: string;
  course?: Course;
  user?: Profile;
}

export interface CertificateTemplate {
  id: string;
  org_id: string;
  name: string;
  certificate_type: CertificateType;
  template_html: string;
  css_styles: string | null;
  logo_position: string;
  signature_position: string;
  is_default: boolean;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface LetterOfRecommendation {
  id: string;
  user_id: string;
  course_id: string | null;
  certificate_id: string | null;
  lor_number: string;
  recipient_name: string;
  recipient_email: string | null;
  title: string;
  content: string;
  recommendation_type: string;
  skills_highlighted: string[];
  achievements: string[];
  performance_rating: number | null;
  recommender_name: string;
  recommender_title: string | null;
  recommender_signature_url: string | null;
  pdf_url: string | null;
  issued_at: string;
  expires_at: string | null;
  is_public: boolean;
  status: LorStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  course?: Course;
  user?: Profile;
}

export interface CertificateVerificationLog {
  id: string;
  certificate_id: string | null;
  lor_id: string | null;
  verified_at: string;
  verification_method: 'qr_scan' | 'id_lookup' | 'url';
  verifier_ip: string | null;
  verifier_user_agent: string | null;
  verification_result: 'valid' | 'expired' | 'revoked' | 'not_found';
}

export interface CertificateFormData {
  user_id: string;
  course_id: string;
  certificate_type: CertificateType;
  recipient_name: string;
  recipient_email?: string;
  course_duration?: string;
  start_date?: string;
  end_date?: string;
  issued_by: string;
  expires_at?: string;
}

export interface LorFormData {
  user_id: string;
  course_id?: string;
  certificate_id?: string;
  recipient_name: string;
  recipient_email?: string;
  title: string;
  content: string;
  recommendation_type: string;
  skills_highlighted: string[];
  achievements: string[];
  performance_rating?: number;
  recommender_name: string;
  recommender_title?: string;
}
