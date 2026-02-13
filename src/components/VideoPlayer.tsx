import { useState } from 'react';
import { Play } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  videoType: 'youtube' | 'stream';
  title?: string;
}

export function VideoPlayer({ videoUrl, videoType, title }: VideoPlayerProps) {
  const [showVideo, setShowVideo] = useState(false);

  if (!videoUrl) return null;

  if (videoType === 'youtube') {
    return (
      <div className="mt-4 pt-4 border-t">
        {!showVideo ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Play className="h-4 w-4 text-primary" />
            <span>
              Need more help?{' '}
              <button
                onClick={() => setShowVideo(true)}
                className="text-primary hover:underline font-medium inline-flex items-center gap-1"
              >
                Watch video solution
              </button>
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Play className="h-4 w-4 text-primary" />
                <span>Video Solution</span>
              </div>
              <button
                onClick={() => setShowVideo(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Hide
              </button>
            </div>
            <div className="aspect-video rounded-lg overflow-hidden border">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoUrl}`}
                title={title || 'Video Solution'}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Cloudflare Stream support (for future)
  if (videoType === 'stream') {
    return (
      <div className="mt-4 pt-4 border-t">
        {!showVideo ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Play className="h-4 w-4 text-primary" />
            <span>
              Need more help?{' '}
              <button
                onClick={() => setShowVideo(true)}
                className="text-primary hover:underline font-medium inline-flex items-center gap-1"
              >
                Watch video solution
              </button>
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Play className="h-4 w-4 text-primary" />
                <span>Video Solution</span>
              </div>
              <button
                onClick={() => setShowVideo(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Hide
              </button>
            </div>
            <div className="aspect-video rounded-lg overflow-hidden border">
              <iframe
                src={`https://customer-${videoUrl}.cloudflarestream.com/iframe`}
                title={title || 'Video Solution'}
                style={{ border: 'none', width: '100%', height: '100%' }}
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

