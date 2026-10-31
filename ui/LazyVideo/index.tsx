'use client';

import { useEffect, useRef, useState } from 'react';

const PRELOAD_MARGIN = '300px';

export default function LazyVideo({
  src,
  poster,
  className,
  wrapperClassName,
  loop = true,
  ariaLabel,
}: {
  src: string;
  poster: string;
  className?: string;
  wrapperClassName?: string;
  loop?: boolean;
  ariaLabel?: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mounted, setMounted] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;

        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setMounted(true);
      },
      { rootMargin: PRELOAD_MARGIN },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (inView) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [inView]);

  return (
    <div className={wrapperClassName} ref={wrapperRef}>
      {mounted ? (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          preload="none"
          playsInline
          muted
          autoPlay
          loop={loop}
          aria-label={ariaLabel}
          className={className}
        />
      ) : (
        <img src={poster} alt={ariaLabel ?? ''} fetchPriority="low" decoding="async" className={className} />
      )}
    </div>
  );
}
