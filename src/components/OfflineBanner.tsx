'use client';

import { WifiOff } from 'lucide-react';

export default function OfflineBanner() {
  return (
    <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-amber-500 text-white py-2 px-4 text-sm font-medium">
      <WifiOff size={15} />
      You&apos;re offline — showing cached data
    </div>
  );
}
