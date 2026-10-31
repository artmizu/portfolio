'use client';

import dynamic from 'next/dynamic';
import st from './placeholder.module.scss';

function ArtPlaceholder() {
  return <div className={st.placeholder} />;
}

const ArtCanvas = dynamic(() => import('./Canvas'), {
  ssr: false,
  loading: ArtPlaceholder,
});

export default function Art() {
  return <ArtCanvas />;
}
