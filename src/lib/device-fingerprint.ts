// Device fingerprinting utility for security module

export interface DeviceInfo {
  fingerprint: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  os: string;
}

// Generate a simple device fingerprint based on available browser info
export function generateDeviceFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = "14px 'Arial'";
    ctx.fillText('Device fingerprint', 2, 2);
  }
  
  const canvasFingerprint = canvas.toDataURL();
  
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 'unknown',
    canvasFingerprint.slice(0, 50),
  ];
  
  // Simple hash function
  const str = components.join('|');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(36) + '-' + Date.now().toString(36).slice(-4);
}

// Get browser name from user agent
export function getBrowserName(): string {
  const ua = navigator.userAgent;
  
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('MSIE') || ua.includes('Trident')) return 'Internet Explorer';
  
  return 'Unknown';
}

// Get OS name from user agent
export function getOSName(): string {
  const ua = navigator.userAgent;
  
  if (ua.includes('Windows NT 10')) return 'Windows 10';
  if (ua.includes('Windows NT 6.3')) return 'Windows 8.1';
  if (ua.includes('Windows NT 6.2')) return 'Windows 8';
  if (ua.includes('Windows NT 6.1')) return 'Windows 7';
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS X')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  
  return 'Unknown';
}

// Get device type
export function getDeviceType(): 'desktop' | 'mobile' | 'tablet' | 'unknown' {
  const ua = navigator.userAgent.toLowerCase();
  
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(navigator.userAgent)) {
    return 'mobile';
  }
  if (typeof window !== 'undefined' && window.innerWidth > 1024) {
    return 'desktop';
  }
  
  return 'unknown';
}

// Get device name (combination of OS + Browser)
export function getDeviceName(): string {
  return `${getBrowserName()} on ${getOSName()}`;
}

// Get complete device info
export function getDeviceInfo(): DeviceInfo {
  return {
    fingerprint: generateDeviceFingerprint(),
    name: getDeviceName(),
    type: getDeviceType(),
    browser: getBrowserName(),
    os: getOSName(),
  };
}

// Store device fingerprint in localStorage
export function storeDeviceFingerprint(fingerprint: string): void {
  try {
    localStorage.setItem('device_fingerprint', fingerprint);
  } catch {
    // localStorage not available
  }
}

// Get stored device fingerprint
export function getStoredDeviceFingerprint(): string | null {
  try {
    return localStorage.getItem('device_fingerprint');
  } catch {
    return null;
  }
}

// Get or create device fingerprint
export function getOrCreateDeviceFingerprint(): string {
  let fingerprint = getStoredDeviceFingerprint();
  
  if (!fingerprint) {
    fingerprint = generateDeviceFingerprint();
    storeDeviceFingerprint(fingerprint);
  }
  
  return fingerprint;
}
