import { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, 
  Download, FileText, File, Music, 
  Presentation, ChevronLeft, ChevronRight,
  CheckCircle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { sanitizeHTML } from '@/lib/sanitize-html';
import type { Lesson } from '@/types/database';

interface ContentViewerProps {
  lesson: Lesson;
  onComplete: () => void;
  isCompleted?: boolean;
  allowDownload?: boolean;
}

export function ContentViewer({ lesson, onComplete, isCompleted, allowDownload = true }: ContentViewerProps) {
  const contentType = lesson.content_type;

  switch (contentType) {
    case 'video':
      return <VideoViewer lesson={lesson} onComplete={onComplete} isCompleted={isCompleted} allowDownload={allowDownload} />;
    case 'text':
      return <TextViewer lesson={lesson} onComplete={onComplete} isCompleted={isCompleted} />;
    default:
      // Handle file types based on content_url extension
      const url = lesson.content_url || '';
      if (url.match(/\.(pdf)$/i)) {
        return <PDFViewer lesson={lesson} onComplete={onComplete} isCompleted={isCompleted} allowDownload={allowDownload} />;
      }
      if (url.match(/\.(ppt|pptx)$/i)) {
        return <PresentationViewer lesson={lesson} onComplete={onComplete} isCompleted={isCompleted} allowDownload={allowDownload} />;
      }
      if (url.match(/\.(doc|docx)$/i)) {
        return <DocumentViewer lesson={lesson} onComplete={onComplete} isCompleted={isCompleted} allowDownload={allowDownload} />;
      }
      if (url.match(/\.(mp3|wav|ogg|m4a)$/i)) {
        return <AudioViewer lesson={lesson} onComplete={onComplete} isCompleted={isCompleted} allowDownload={allowDownload} />;
      }
      return <TextViewer lesson={lesson} onComplete={onComplete} isCompleted={isCompleted} />;
  }
}

// Video Viewer Component
function VideoViewer({ lesson, onComplete, isCompleted, allowDownload }: ContentViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const content = lesson.content as Record<string, unknown> | null;
  const videoUrl = content?.url as string | undefined || lesson.content_url;

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
    if (!isCompleted) {
      onComplete();
    }
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

  return (
    <div className="space-y-4">
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full"
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
            poster={content?.thumbnail as string | undefined}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/60">
            <div className="text-center">
              <Play className="h-16 w-16 mx-auto mb-3" />
              <p>Video not available</p>
            </div>
          </div>
        )}
        
        {/* Video Controls Overlay */}
        {videoUrl && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
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
                  <Button variant="ghost" size="icon" onClick={togglePlay} className="text-white hover:bg-white/20">
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)} className="text-white hover:bg-white/20">
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </Button>
                  <span className="text-sm text-white/80">
                    {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {allowDownload && videoUrl && (
                    <Button variant="ghost" size="icon" asChild className="text-white hover:bg-white/20">
                      <a href={videoUrl} download>
                        <Download className="h-5 w-5" />
                      </a>
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => videoRef.current?.requestFullscreen()} 
                    className="text-white hover:bg-white/20"
                  >
                    <Maximize className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <CompletionButton isCompleted={isCompleted} onComplete={onComplete} />
    </div>
  );
}

// Audio Viewer Component
function AudioViewer({ lesson, onComplete, isCompleted, allowDownload }: ContentViewerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioUrl = lesson.content_url;

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration;
      setProgress((current / total) * 100);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (!isCompleted) {
      onComplete();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-8">
        <audio
          ref={audioRef}
          src={audioUrl || ''}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        />

        <div className="flex flex-col items-center gap-6">
          <div className="h-24 w-24 rounded-full bg-gradient-primary flex items-center justify-center">
            <Music className="h-12 w-12 text-primary-foreground" />
          </div>

          <div className="w-full max-w-md space-y-4">
            <h3 className="font-semibold text-center">{lesson.title}</h3>
            
            <Slider 
              value={[progress]} 
              onValueChange={(value) => {
                if (audioRef.current) {
                  audioRef.current.currentTime = (value[0] / 100) * audioRef.current.duration;
                }
              }}
              max={100}
              step={0.1}
            />

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
              <span>{formatTime(duration)}</span>
            </div>

            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" size="icon" onClick={togglePlay}>
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              {allowDownload && audioUrl && (
                <Button variant="outline" size="icon" asChild>
                  <a href={audioUrl} download>
                    <Download className="h-5 w-5" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <CompletionButton isCompleted={isCompleted} onComplete={onComplete} />
    </div>
  );
}

// PDF Viewer Component
function PDFViewer({ lesson, onComplete, isCompleted, allowDownload }: ContentViewerProps) {
  const pdfUrl = lesson.content_url;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-destructive" />
          <span className="font-medium">{lesson.title}</span>
        </div>
        {allowDownload && pdfUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={pdfUrl} download>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </a>
          </Button>
        )}
      </div>

      {pdfUrl ? (
        <iframe 
          src={`${pdfUrl}#view=FitH`}
          className="w-full h-[600px] rounded-lg border"
          title={lesson.title}
        />
      ) : (
        <div className="h-[400px] flex items-center justify-center bg-muted rounded-lg">
          <div className="text-center text-muted-foreground">
            <FileText className="h-16 w-16 mx-auto mb-3" />
            <p>PDF not available</p>
          </div>
        </div>
      )}

      <CompletionButton isCompleted={isCompleted} onComplete={onComplete} />
    </div>
  );
}

// Presentation Viewer Component
function PresentationViewer({ lesson, onComplete, isCompleted, allowDownload }: ContentViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(1);
  const totalSlides = 10; // This would come from actual presentation data
  const pptUrl = lesson.content_url;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Presentation className="h-5 w-5 text-warning" />
          <span className="font-medium">{lesson.title}</span>
        </div>
        {allowDownload && pptUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={pptUrl} download>
              <Download className="h-4 w-4 mr-2" />
              Download PPT
            </a>
          </Button>
        )}
      </div>

      <div className="bg-muted rounded-lg overflow-hidden">
        {pptUrl ? (
          <iframe 
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(pptUrl)}`}
            className="w-full h-[500px]"
            title={lesson.title}
          />
        ) : (
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Presentation className="h-16 w-16 mx-auto mb-3" />
              <p>Presentation not available</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-4 p-4 bg-background border-t">
          <Button 
            variant="outline" 
            size="icon" 
            disabled={currentSlide <= 1}
            onClick={() => setCurrentSlide(prev => prev - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Slide {currentSlide} of {totalSlides}
          </span>
          <Button 
            variant="outline" 
            size="icon" 
            disabled={currentSlide >= totalSlides}
            onClick={() => setCurrentSlide(prev => prev + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CompletionButton isCompleted={isCompleted} onComplete={onComplete} />
    </div>
  );
}

// Document Viewer Component
function DocumentViewer({ lesson, onComplete, isCompleted, allowDownload }: ContentViewerProps) {
  const docUrl = lesson.content_url;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <File className="h-5 w-5 text-primary" />
          <span className="font-medium">{lesson.title}</span>
        </div>
        {allowDownload && docUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={docUrl} download>
              <Download className="h-4 w-4 mr-2" />
              Download Document
            </a>
          </Button>
        )}
      </div>

      {docUrl ? (
        <iframe 
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(docUrl)}`}
          className="w-full h-[600px] rounded-lg border"
          title={lesson.title}
        />
      ) : (
        <div className="h-[400px] flex items-center justify-center bg-muted rounded-lg">
          <div className="text-center text-muted-foreground">
            <File className="h-16 w-16 mx-auto mb-3" />
            <p>Document not available</p>
          </div>
        </div>
      )}

      <CompletionButton isCompleted={isCompleted} onComplete={onComplete} />
    </div>
  );
}

// Text Viewer Component
function TextViewer({ lesson, onComplete, isCompleted }: Omit<ContentViewerProps, 'allowDownload'>) {
  const content = lesson.content_text || (lesson.content as Record<string, unknown>)?.text as string || '';

  return (
    <div className="space-y-4">
      <div className="prose prose-slate dark:prose-invert max-w-none p-6 bg-card rounded-lg border">
        <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(content) }} />
      </div>

      <CompletionButton isCompleted={isCompleted} onComplete={onComplete} />
    </div>
  );
}

// Completion Button Component
function CompletionButton({ isCompleted, onComplete }: { isCompleted?: boolean; onComplete: () => void }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async () => {
    setIsLoading(true);
    await onComplete();
    setIsLoading(false);
  };

  if (isCompleted) {
    return (
      <div className="flex items-center gap-2 text-success p-4 bg-success/10 rounded-lg">
        <CheckCircle className="h-5 w-5" />
        <span className="font-medium">Lesson Completed</span>
      </div>
    );
  }

  return (
    <Button onClick={handleComplete} disabled={isLoading} className="w-full bg-gradient-primary hover:opacity-90">
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Marking as complete...
        </>
      ) : (
        <>
          <CheckCircle className="h-4 w-4 mr-2" />
          Mark as Complete
        </>
      )}
    </Button>
  );
}
