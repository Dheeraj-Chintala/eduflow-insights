import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, 
  AlertTriangle, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/hooks/useAuth';
import { useSecuritySettings } from '@/hooks/useSecuritySettings';
import { supabase } from '@/integrations/supabase/client';
import { getOrCreateDeviceFingerprint } from '@/lib/device-fingerprint';

interface SecureVideoPlayerProps {
  videoUrl: string;
  lessonId?: string;
  courseId?: string;
  onComplete?: () => void;
  thumbnail?: string;
}

export default function SecureVideoPlayer({ 
  videoUrl, 
  lessonId, 
  courseId, 
  onComplete,
  thumbnail 
}: SecureVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user, profile } = useAuth();
  const { settings } = useSecuritySettings();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isBlurred, setIsBlurred] = useState(false);
  const [startTime] = useState(Date.now());

  // Generate watermark text
  const watermarkText = settings?.enable_watermark 
    ? (settings.watermark_text_template || '{{user_email}}')
        .replace('{{user_email}}', profile?.full_name || user?.email || '')
        .replace('{{timestamp}}', new Date().toLocaleString())
        .replace('{{user_id}}', user?.id?.slice(0, 8) || '')
    : '';

  // Prevent right-click
  useEffect(() => {
    if (!settings?.enable_right_click_prevention) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('contextmenu', handleContextMenu);
      return () => container.removeEventListener('contextmenu', handleContextMenu);
    }
  }, [settings?.enable_right_click_prevention]);

  // Screen capture prevention - blur video when window loses focus
  useEffect(() => {
    if (!settings?.enable_screen_capture_prevention) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBlurred(true);
        if (videoRef.current && isPlaying) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      } else {
        setIsBlurred(false);
      }
    };

    const handleBlur = () => {
      setIsBlurred(true);
    };

    const handleFocus = () => {
      setIsBlurred(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [settings?.enable_screen_capture_prevention, isPlaying]);

  // Prevent keyboard shortcuts for screenshots
  useEffect(() => {
    if (!settings?.enable_screen_capture_prevention) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Print Screen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        setIsBlurred(true);
        setTimeout(() => setIsBlurred(false), 2000);
      }
      // Prevent common screenshot shortcuts
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings?.enable_screen_capture_prevention]);

  // Log content access
  const logContentAccess = useCallback(async (accessType: 'view' | 'stream') => {
    if (!user) return;

    try {
      await supabase.from('content_access_logs').insert({
        user_id: user.id,
        content_type: 'video',
        content_id: lessonId || videoUrl,
        course_id: courseId,
        lesson_id: lessonId,
        access_type: accessType,
        device_fingerprint: getOrCreateDeviceFingerprint(),
        watermark_applied: settings?.enable_watermark || false,
        duration_seconds: Math.round((Date.now() - startTime) / 1000),
      });
    } catch (error) {
      console.error('Error logging content access:', error);
    }
  }, [user, lessonId, courseId, videoUrl, settings?.enable_watermark, startTime]);

  // Log when video starts playing
  useEffect(() => {
    if (isPlaying) {
      logContentAccess('stream');
    }
  }, [isPlaying, logContentAccess]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setProgress((current / total) * 100);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    logContentAccess('view');
    onComplete?.();
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = (value[0] / 100) * videoRef.current.duration;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative aspect-video bg-black rounded-lg overflow-hidden group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      style={{ userSelect: 'none' }}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        className={`w-full h-full transition-all duration-300 ${isBlurred ? 'blur-xl' : ''}`}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        poster={thumbnail}
        playsInline
        controlsList="nodownload"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Blur Overlay Message */}
      {isBlurred && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="text-center text-white">
            <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-warning" />
            <p className="font-semibold">Screen capture detected</p>
            <p className="text-sm text-white/70">Video is hidden for content protection</p>
          </div>
        </div>
      )}

      {/* Watermark Overlay */}
      {settings?.enable_watermark && watermarkText && !isBlurred && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          {/* Diagonal repeating watermark pattern */}
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: 'transparent',
            }}
          >
            <div 
              className="text-white/10 text-sm font-medium whitespace-nowrap transform -rotate-45"
              style={{
                fontSize: '14px',
                letterSpacing: '2px',
              }}
            >
              {watermarkText}
            </div>
          </div>
          {/* Corner watermark */}
          <div className="absolute bottom-16 right-4 text-white/30 text-xs">
            {watermarkText}
          </div>
        </div>
      )}

      {/* Protected Content Badge */}
      {settings?.video_protection_level !== 'none' && (
        <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2 py-1 bg-black/50 rounded text-xs text-white/70 z-10">
          <Shield className="h-3 w-3" />
          <span>Protected Content</span>
        </div>
      )}

      {/* Video Controls */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="space-y-2">
          <Slider 
            value={[progress]} 
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="cursor-pointer"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={togglePlay} 
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsMuted(!isMuted)} 
                className="text-white hover:bg-white/20"
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
              <span className="text-sm text-white/80">
                {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20"
              >
                <Maximize className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mute audio element */}
      {isMuted && videoRef.current && (videoRef.current.muted = true)}
      {!isMuted && videoRef.current && (videoRef.current.muted = false)}
    </div>
  );
}
