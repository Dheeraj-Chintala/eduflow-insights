import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { formatCertificateDate } from '@/lib/certificate-utils';
import type { LetterOfRecommendation } from '@/types/certificate';

interface LorTemplateProps {
  lor: LetterOfRecommendation;
  organizationName?: string;
  organizationLogo?: string;
  organizationAddress?: string;
}

export const LorTemplate = forwardRef<HTMLDivElement, LorTemplateProps>(
  ({ lor, organizationName = 'Learning Institute', organizationLogo, organizationAddress }, ref) => {
    const verificationUrl = `${window.location.origin}/verify/${lor.lor_number}`;
    
    return (
      <div
        ref={ref}
        className="w-[816px] min-h-[1056px] bg-white p-12"
        style={{
          fontFamily: "'Times New Roman', serif"
        }}
      >
        {/* Header */}
        <div className="border-b-2 border-slate-300 pb-6 mb-8">
          <div className="flex items-start justify-between">
            {organizationLogo ? (
              <img 
                src={organizationLogo} 
                alt="Organization Logo" 
                className="h-16 object-contain"
              />
            ) : (
              <div className="text-2xl font-bold text-slate-800">
                {organizationName}
              </div>
            )}
            <div className="text-right text-sm text-slate-600">
              {organizationAddress && (
                <p className="whitespace-pre-line">{organizationAddress}</p>
              )}
              <p className="mt-2">Date: {formatCertificateDate(lor.issued_at)}</p>
            </div>
          </div>
        </div>
        
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-wide text-slate-800 uppercase">
            Letter of Recommendation
          </h1>
          <p className="text-sm text-slate-500 mt-1">Ref: {lor.lor_number}</p>
        </div>
        
        {/* Salutation */}
        <div className="mb-6">
          <p className="text-lg text-slate-800">To Whom It May Concern,</p>
        </div>
        
        {/* Content */}
        <div className="text-slate-700 leading-relaxed space-y-4 mb-8 text-justify whitespace-pre-wrap">
          {lor.content}
        </div>
        
        {/* Skills & Achievements */}
        {(lor.skills_highlighted?.length > 0 || lor.achievements?.length > 0) && (
          <div className="mb-8 space-y-4">
            {lor.skills_highlighted?.length > 0 && (
              <div>
                <p className="font-semibold text-slate-800 mb-2">Key Skills Demonstrated:</p>
                <ul className="list-disc list-inside text-slate-700 ml-4">
                  {lor.skills_highlighted.map((skill, index) => (
                    <li key={index}>{skill}</li>
                  ))}
                </ul>
              </div>
            )}
            {lor.achievements?.length > 0 && (
              <div>
                <p className="font-semibold text-slate-800 mb-2">Notable Achievements:</p>
                <ul className="list-disc list-inside text-slate-700 ml-4">
                  {lor.achievements.map((achievement, index) => (
                    <li key={index}>{achievement}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        {/* Closing */}
        <div className="mb-12">
          <p className="text-slate-700">
            I wholeheartedly recommend {lor.recipient_name} for any position or opportunity that aligns with their skills and aspirations.
          </p>
        </div>
        
        {/* Signature Section */}
        <div className="flex justify-between items-end">
          <div>
            <p className="text-slate-600 mb-4">Yours sincerely,</p>
            {lor.recommender_signature_url ? (
              <img 
                src={lor.recommender_signature_url} 
                alt="Signature" 
                className="h-12 object-contain mb-2"
              />
            ) : (
              <div className="h-12 border-b border-slate-400 w-40 mb-2" />
            )}
            <p className="font-semibold text-slate-800">{lor.recommender_name}</p>
            {lor.recommender_title && (
              <p className="text-sm text-slate-600">{lor.recommender_title}</p>
            )}
          </div>
          
          {/* QR Code */}
          <div className="text-center">
            <QRCodeSVG 
              value={verificationUrl}
              size={64}
              level="H"
              includeMargin={false}
            />
            <p className="text-xs text-slate-500 mt-1">Scan to verify</p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-12 pt-4 border-t border-slate-200 text-center text-xs text-slate-500">
          <p>This letter can be verified at: {verificationUrl}</p>
        </div>
      </div>
    );
  }
);

LorTemplate.displayName = 'LorTemplate';
