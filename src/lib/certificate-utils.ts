import { nanoid } from 'nanoid';

export function generateCertificateNumber(): string {
  const prefix = 'CERT';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = nanoid(6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function generateLorNumber(): string {
  const prefix = 'LOR';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = nanoid(6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function getVerificationUrl(certificateNumber: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/verify/${certificateNumber}`;
}

export function formatCertificateDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function getCertificateTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    course: 'Course Completion',
    internship: 'Internship',
    experience: 'Experience',
    lor: 'Letter of Recommendation'
  };
  return labels[type] || type;
}

export function validateCertificateNumber(number: string): boolean {
  // Format: CERT-TIMESTAMP-RANDOM or LOR-TIMESTAMP-RANDOM
  const pattern = /^(CERT|LOR)-[A-Z0-9]+-[A-Z0-9]{6}$/;
  return pattern.test(number);
}
