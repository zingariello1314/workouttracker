import manifest from '../../data/bankMediaManifest.json';

export function bankMediaUrl(sourcePath) {
  if (!sourcePath) return '';
  return `/bank-media/${sourcePath.split('/').map(encodeURIComponent).join('/')}`;
}

function isGifStandIn(video) {
  return video?.sourceCollection === 'deuxieme dossier gif'
    || String(video?.sourcePath || '').startsWith('deuxieme dossier gif/');
}

export function exerciseHasVideo(exercise) {
  return (mediaForExercise(exercise)?.videos || []).some((video) => !isGifStandIn(video));
}

export function exerciseHasGif(exercise) {
  const media = mediaForExercise(exercise);
  if (media?.card?.sourcePath) return true;
  return (media?.videos || []).some(isGifStandIn);
}

export function mediaForExercise(exercise) {
  if (!exercise) return null;
  const ids = [];
  if (exercise.databaseKey) ids.push(`db:${exercise.databaseKey}`);
  if (exercise.scoringKey) ids.push(`score:${exercise.scoringKey}`);
  if (typeof exercise.id === 'string' && exercise.id.startsWith('cardio_')) ids.push(`cardio:${exercise.id}`);
  for (const id of ids) {
    if (manifest.exercises[id]) return manifest.exercises[id];
  }
  return null;
}

export function mediaForStretch(stretch) {
  if (!stretch?.key) return null;
  return manifest.stretches[`stretch:${stretch.key}`] || null;
}

export function circuitList() {
  return manifest.circuits || [];
}

export function BankCardGif({ media, children }) {
  if (media?.card?.sourcePath) {
    return (
      <img
        src={bankMediaUrl(media.card.sourcePath)}
        alt=""
        className="h-full w-full object-cover bg-black"
        loading="lazy"
        draggable={false}
      />
    );
  }
  const standIn = (media?.videos || []).find(isGifStandIn);
  if (!standIn) return children;
  return (
    <video
      src={bankMediaUrl(standIn.sourcePath)}
      className="h-full w-full object-cover bg-black"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
    />
  );
}

export function BankDetailMedia({ media, videosRef, gifRef }) {
  if (!media) return null;
  const videos = media.videos || [];
  const featured = videos.filter((video) => !isGifStandIn(video));
  const standIns = videos.filter(isGifStandIn);
  const gif = media.gif || media.card;
  if (featured.length === 0 && standIns.length === 0 && !gif?.sourcePath) return null;

  return (
    <div className="space-y-4">
      {featured.length > 0 && (
        <div ref={videosRef} className="flex flex-wrap items-start justify-center gap-4">
          {featured.map((video) => (
            <video
              key={video.mediaId}
              src={bankMediaUrl(video.sourcePath)}
              className="block h-auto w-auto max-h-[85vh] max-w-full rounded-xl"
              autoPlay
              muted
              loop
              playsInline
              controls
              preload="metadata"
            />
          ))}
        </div>
      )}
      {(standIns.length > 0 || gif?.sourcePath) && (
        <div ref={gifRef} className="flex flex-wrap items-start justify-center gap-4">
          {standIns.map((video) => (
            <video
              key={video.mediaId}
              src={bankMediaUrl(video.sourcePath)}
              className="max-h-[360px] w-auto max-w-full rounded-xl bg-black object-contain"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
          ))}
          {gif?.sourcePath && (
            <img
              src={bankMediaUrl(gif.sourcePath)}
              alt=""
              className="max-h-[360px] w-auto max-w-full rounded-xl bg-black object-contain"
              loading="lazy"
            />
          )}
        </div>
      )}
    </div>
  );
}
