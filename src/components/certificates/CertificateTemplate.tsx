import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Award } from 'lucide-react';
import { formatCertificateDate, getCertificateTypeLabel } from '@/lib/certificate-utils';
import type { Certificate } from '@/types/certificate';

interface CertificateTemplateProps {
  certificate: Certificate;
  organizationName?: string;
  organizationLogo?: string;
  signatureUrl?: string;
  signerName?: string;
  signerTitle?: string;
}

export const CertificateTemplate = forwardRef<HTMLDivElement, CertificateTemplateProps>(
  ({ certificate, organizationName = 'Learning Institute', organizationLogo, signatureUrl, signerName = 'Director', signerTitle = 'Program Director' }, ref) => {
    const verificationUrl = certificate.verification_url || `${window.location.origin}/verify/${certificate.certificate_number}`;
    
    return (
      <div
        ref={ref}
        className="w-[1056px] h-[816px] bg-white relative overflow-hidden"
        style={{
          fontFamily: "'Times New Roman', serif",
          background: 'linear-gradient(135deg, #fdfbf9 0%, #f8f6f4 100%)'
        }}
      >
        {/* Decorative Border */}
        <div className="absolute inset-4 border-[3px] border-amber-600/30 rounded-lg" />
        <div className="absolute inset-6 border border-amber-600/20 rounded-lg" />
        
        {/* Corner Decorations */}
        <div className="absolute top-8 left-8 w-20 h-20 border-l-4 border-t-4 border-amber-600/40 rounded-tl-lg" />
        <div className="absolute top-8 right-8 w-20 h-20 border-r-4 border-t-4 border-amber-600/40 rounded-tr-lg" />
        <div className="absolute bottom-8 left-8 w-20 h-20 border-l-4 border-b-4 border-amber-600/40 rounded-bl-lg" />
        <div className="absolute bottom-8 right-8 w-20 h-20 border-r-4 border-b-4 border-amber-600/40 rounded-br-lg" />
        
        {/* Content Container */}
        <div className="absolute inset-12 flex flex-col items-center justify-between py-8">
          {/* Header with Logo */}
          <div className="text-center">
            {organizationLogo ? (
              <img 
                src={organizationLogo} 
                alt="Organization Logo" 
                className="h-20 mx-auto mb-4 object-contain"
              />
            ) : (
              <div className="flex items-center justify-center gap-3 mb-4">
                <Award className="h-12 w-12 text-amber-600" />
                <span className="text-3xl font-bold text-slate-800 tracking-wide">
                  {organizationName}
                </span>
              </div>
            )}
            
            <div className="mt-4">
              <h1 className="text-5xl font-bold tracking-[0.2em] text-slate-800 uppercase">
                Certificate
              </h1>
              <p className="text-xl text-slate-600 mt-2 tracking-widest uppercase">
                of {getCertificateTypeLabel(certificate.certificate_type || 'course')}
              </p>
            </div>
          </div>
          
          {/* Recipient Section */}
          <div className="text-center space-y-4">
            <p className="text-lg text-slate-600">This is to certify that</p>
            <h2 className="text-4xl font-bold text-slate-800 border-b-2 border-amber-600/40 pb-2 px-8">
              {certificate.recipient_name || 'Recipient Name'}
            </h2>
            <p className="text-lg text-slate-600 max-w-xl mx-auto">
              has successfully completed the
            </p>
            <h3 className="text-2xl font-semibold text-primary">
              {certificate.course?.title || 'Program Name'}
            </h3>
            {certificate.course_duration && (
              <p className="text-base text-slate-500">
                Duration: {certificate.course_duration}
              </p>
            )}
            {(certificate.start_date || certificate.end_date) && (
              <p className="text-base text-slate-500">
                {certificate.start_date && `From ${formatCertificateDate(certificate.start_date)}`}
                {certificate.start_date && certificate.end_date && ' to '}
                {certificate.end_date && formatCertificateDate(certificate.end_date)}
              </p>
            )}
          </div>
          
          {/* Footer Section */}
          <div className="w-full flex justify-between items-end px-8">
            {/* QR Code */}
            <div className="text-center">
              <QRCodeSVG 
                value={verificationUrl}
                size={80}
                level="H"
                includeMargin={false}
                className="rounded"
              />
              <p className="text-xs text-slate-500 mt-2">Scan to verify</p>
            </div>
            
            {/* Issue Date & Certificate Number */}
            <div className="text-center">
              <p className="text-base text-slate-600">
                Issued on {formatCertificateDate(certificate.issued_at)}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Certificate ID: {certificate.certificate_number}
              </p>
              {certificate.expires_at && (
                <p className="text-xs text-slate-400 mt-1">
                  Valid until {formatCertificateDate(certificate.expires_at)}
                </p>
              )}
            </div>
            
            {/* Signature */}
            <div className="text-center">
              {signatureUrl ? (
                <img 
                  src={signatureUrl} 
                  alt="Authorized Signature" 
                  className="h-12 mx-auto mb-2 object-contain"
                />
              ) : (
                <div className="h-12 border-b border-slate-400 w-32 mb-2" />
              )}
              <p className="text-sm font-semibold text-slate-700">{signerName}</p>
              <p className="text-xs text-slate-500">{signerTitle}</p>
            </div>
          </div>
        </div>
        
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <Award className="h-96 w-96 text-slate-800" />
        </div>
      </div>
    );
  }
);

CertificateTemplate.displayName = 'CertificateTemplate';
