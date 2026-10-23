/* eslint-disable @next/next/no-img-element -- pre-sized WebP files with srcset; next/image adds nothing here. */

/** An original SarafuPay image from /public/photos, available at 640 and 1200 px wide. */
export type Shot = { name: string; alt: string; focus?: string };

export function Photo({ shot, className = "", sizes = "(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw" }: { shot: Shot; className?: string; sizes?: string }) {
  return (
    <img
      src={`/photos/${shot.name}-1200.webp`}
      srcSet={`/photos/${shot.name}-640.webp 640w, /photos/${shot.name}-1200.webp 1200w`}
      sizes={sizes}
      alt={shot.alt}
      loading="lazy"
      decoding="async"
      className={`h-full w-full object-cover ${className}`}
      style={shot.focus ? { objectPosition: shot.focus } : undefined}
    />
  );
}
