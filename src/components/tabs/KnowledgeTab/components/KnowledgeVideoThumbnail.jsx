import React, { useEffect, useState } from 'react';
import { Film } from 'lucide-react';
import {
  fetchKnowledgeVideoThumbnailUrl,
  revokeKnowledgePlayUrl
} from '../../../../services/knowledge/knowledgeApi';

export default function KnowledgeVideoThumbnail({ videoId, className = '' }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let active = true;
    let objectUrl = null;
    fetchKnowledgeVideoThumbnailUrl(videoId)
      .then((u) => {
        if (!active) {
          if (u) revokeKnowledgePlayUrl(u);
          return;
        }
        objectUrl = u;
        setUrl(u);
      })
      .catch(() => {
        if (active) setUrl(null);
      });
    return () => {
      active = false;
      if (objectUrl) revokeKnowledgePlayUrl(objectUrl);
    };
  }, [videoId]);

  if (url) {
    return (
      <img
        src={url}
        alt=""
        className={`h-full w-full object-cover ${className}`}
        loading="lazy"
      />
    );
  }

  return (
    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-950/80 to-black ${className}`}>
      <Film className="h-10 w-10 text-violet-400/40" />
    </div>
  );
}
