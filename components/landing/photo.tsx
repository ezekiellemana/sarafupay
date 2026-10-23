/* eslint-disable @next/next/no-img-element -- served straight from the Unsplash CDN, as their licence asks. */

/** A free-licence Unsplash photo, hotlinked from their CDN. */
export type Shot = { id: string; page: string; by: string; alt: string; focus?: string };

const src = (id: string, w: number) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

export function Photo({ shot, className = "", sizes = "(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw" }: { shot: Shot; className?: string; sizes?: string }) {
  return (
    <img
      src={src(shot.id, 800)}
      srcSet={[480, 800, 1200].map((w) => `${src(shot.id, w)} ${w}w`).join(", ")}
      sizes={sizes}
      alt={shot.alt}
      loading="lazy"
      decoding="async"
      className={`h-full w-full object-cover ${className}`}
      style={shot.focus ? { objectPosition: shot.focus } : undefined}
    />
  );
}
