'use client';
import { useMemo } from 'react';
import { buildBuddyIconSvg } from '@/lib/buddyIcon';

// Renders a deterministic pixel buddy icon inline (feature 20).
export default function BuddyIcon({ hashHex, status = 'trusted', size = 32 }) {
  const svg = useMemo(
    () => buildBuddyIconSvg(hashHex, { size, status }),
    [hashHex, status, size]
  );
  return (
    <span
      style={{ width: size, height: size, display: 'inline-block', lineHeight: 0 }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
