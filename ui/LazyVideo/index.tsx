'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

const PRELOAD_MARGIN = '300px';

export default function LazyVideo({
  src,
  poster,
  sizes,
  className,
  wrapperClassName,
  loop = true,
}: {
  src: string;
  poster: string;
  sizes: string;
  className?: string;
  wrapperClassName?: string;
  loop?: boolean;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const endedRef = useRef(false);
  const [mounted, setMounted] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element || typeof IntersectionObserver !== 'function') return;

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

    if (!inView) {
      video.pause();
      return;
    }

    if (!endedRef.current) void video.play().catch(() => undefined);
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
          className={className}
          onEnded={() => {
            endedRef.current = true;
          }}
        />
      ) : (
        <Image
          src={poster}
          alt=""
          fill
          sizes={sizes}
          loading="lazy"
          className={className}
          style={{ objectFit: 'cover', objectPosition: 'left top' }}
        />
      )}
    </div>
  );
}
