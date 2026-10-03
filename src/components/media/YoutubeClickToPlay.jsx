import React, { useEffect, useState } from 'react';
import { Play } from 'lucide-react';

function thumbUrl(videoId, quality) {
  return `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/${quality}.jpg`;
}

/**
 * Lecteur YouTube au clic : miniature tout de suite, iframe seulement si l’utilisateur lance la lecture.
 */
export default function YoutubeClickToPlay({ videoId, start = 0, title, className = '' }) {
  const [playing, setPlaying] = useState(false);
  const [thumb, setThumb] = useState(() => thumbUrl(videoId, 'hqdefault'));
  const startSec = Number(start) > 0 ? Math.floor(Number(start)) : 0;

  useEffect(() => {
    setPlaying(false);
    setThumb(thumbUrl(videoId, 'hqdefault'));
  }, [videoId, startSec]);

  if (!videoId) return null;

  const src =
    `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}` +
    `?autoplay=1&rel=0&modestbranding=1${startSec > 0 ? `&start=${startSec}` : ''}`;

  return (
    <div className={`w-full max-w-3xl ${className}`.trim()}>
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-[#3897F0]/30 bg-black shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
        {playing ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={src}
            title={title || 'Vidéo YouTube'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 block h-full w-full cursor-pointer text-left"
            aria-label={title ? `Lire la vidéo : ${title}` : 'Lire la vidéo'}
          >
            <img
              src={thumb}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setThumb(thumbUrl(videoId, 'mqdefault'))}
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/25" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/70 text-white ring-1 ring-white/30 transition group-hover:scale-105 group-hover:bg-[#3897F0]">
                <Play className="ml-1 h-7 w-7 fill-current" aria-hidden />
              </span>
            </span>
            {title ? (
              <span className="absolute bottom-0 left-0 right-0 px-4 pb-3 text-sm font-medium text-white">
                {title}
              </span>
            ) : null}
          </button>
        )}
      </div>
    </div>
  );
}
