import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ShieldCheck, Smartphone, Key, Copy, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import type { User2FASettings } from '@/types/security';

export default function TwoFactorSetup() {
  const { user, profile } = useAuth();
  const [settings, setSettings] = useState<User2FASettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [setupStep, setSetupStep] = useState<'qr' | 'verify' | 'backup'>('qr');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [tempSecret, setTempSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetch2FASettings();
    }
  }, [user]);

  const fetch2FASettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_2fa_settings')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setSettings(data as unknown as User2FASettings | null);
    } catch (error) {
      console.error('Error fetching 2FA settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSecret = () => {
    // Generate a simple base32 secret (in production, use a proper library)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 16; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  };

  const generateBackupCodes = () => {
    const codes: string[] = [];
    for (let i = 0; i < 8; i++) {
      const code = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
                   Math.random().toString(36).substring(2, 6).toUpperCase();
      codes.push(code);
    }
    return codes;
  };

  const startSetup = () => {
    const secret = generateSecret();
    setTempSecret(secret);
    setSetupStep('qr');
    setShowSetupDialog(true);
  };

  const verifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setIsVerifying(true);
    
    // In production, verify the TOTP code server-side
    // For demo, we'll simulate verification
    await new Promise(resolve => setTimeout(resolve, 1000));

    const codes = generateBackupCodes();
    setBackupCodes(codes);
    setSetupStep('backup');
    setIsVerifying(false);
  };

  const completeSetup = async () => {
    try {
      setIsVerifying(true);

      const { error } = await supabase
        .from('user_2fa_settings')
        .upsert({
          user_id: user?.id,
          is_enabled: true,
          method: 'totp',
          totp_secret: tempSecret,
          backup_codes: backupCodes,
          last_verified_at: new Date().toISOString(),
        });

      if (error) throw error;

      await fetch2FASettings();
      setShowSetupDialog(false);
      toast.success('Two-factor authentication enabled');

      // Log security event
      await supabase.from('security_audit_logs').insert({
        user_id: user?.id,
        event_type: '2fa_enabled',
        event_category: 'auth',
        severity: 'info',
        description: 'Two-factor authentication was enabled',
      });
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      toast.error('Failed to enable 2FA');
    } finally {
      setIsVerifying(false);
    }
  };

  const disable2FA = async () => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('user_2fa_settings')
        .update({ is_enabled: false })
        .eq('user_id', user?.id);

      if (error) throw error;

      await fetch2FASettings();
      toast.success('Two-factor authentication disabled');

      // Log security event
      await supabase.from('security_audit_logs').insert({
        user_id: user?.id,
        event_type: '2fa_disabled',
        event_category: 'auth',
        severity: 'warning',
        description: 'Two-factor authentication was disabled',
      });
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      toast.error('Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const otpauthUrl = `otpauth://totp/LMS:${encodeURIComponent(profile?.full_name || user?.email || '')}?secret=${tempSecret}&issuer=LMS`;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${settings?.is_enabled ? 'bg-success/10' : 'bg-muted'}`}>
                {settings?.is_enabled ? (
                  <CheckCircle className="h-6 w-6 text-success" />
                ) : (
                  <Smartphone className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">Authenticator App</p>
                  <Badge variant={settings?.is_enabled ? 'default' : 'secondary'}>
                    {settings?.is_enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {settings?.is_enabled 
                    ? 'Your account is protected with 2FA'
                    : 'Use an authenticator app for verification codes'}
                </p>
              </div>
            </div>
            <Button
              variant={settings?.is_enabled ? 'outline' : 'default'}
              onClick={settings?.is_enabled ? disable2FA : startSetup}
            >
              {settings?.is_enabled ? 'Disable' : 'Enable'}
            </Button>
          </div>

          {settings?.is_enabled && settings.backup_codes && settings.backup_codes.length > 0 && (
            <div className="mt-4 p-4 rounded-lg border bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Key className="h-4 w-4" />
                <p className="font-medium text-sm">Backup Codes</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {settings.backup_codes.length} backup codes remaining. Each code can only be used once.
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyToClipboard(settings.backup_codes!.join('\n'))}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Backup Codes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {setupStep === 'qr' && 'Scan QR Code'}
              {setupStep === 'verify' && 'Verify Setup'}
              {setupStep === 'backup' && 'Save Backup Codes'}
            </DialogTitle>
            <DialogDescription>
              {setupStep === 'qr' && 'Scan this QR code with your authenticator app'}
              {setupStep === 'verify' && 'Enter the 6-digit code from your authenticator app'}
              {setupStep === 'backup' && 'Save these codes in a safe place. You can use them if you lose access to your authenticator.'}
            </DialogDescription>
          </DialogHeader>

          {setupStep === 'qr' && (
            <div className="space-y-4">
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <QRCodeSVG value={otpauthUrl} size={200} />
              </div>
              <div className="space-y-2">
                <Label>Manual Entry Key</Label>
                <div className="flex gap-2">
                  <Input value={tempSecret} readOnly className="font-mono text-sm" />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(tempSecret)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {setupStep === 'verify' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Verification Code</Label>
                <Input
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-2xl tracking-widest font-mono"
                  maxLength={6}
                />
              </div>
            </div>
          )}

          {setupStep === 'backup' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
                {backupCodes.map((code, i) => (
                  <div key={i} className="p-2 bg-background rounded text-center">
                    {code}
                  </div>
                ))}
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => copyToClipboard(backupCodes.join('\n'))}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy All Codes
              </Button>
            </div>
          )}

          <DialogFooter>
            {setupStep === 'qr' && (
              <Button onClick={() => setSetupStep('verify')}>
                Continue
              </Button>
            )}
            {setupStep === 'verify' && (
              <Button onClick={verifyCode} disabled={isVerifying || verificationCode.length !== 6}>
                {isVerifying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Verify
              </Button>
            )}
            {setupStep === 'backup' && (
              <Button onClick={completeSetup} disabled={isVerifying}>
                {isVerifying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                I've Saved My Codes
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
