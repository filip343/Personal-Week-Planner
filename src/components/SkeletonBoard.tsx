'use client';

import { WEEKDAY_SHORT } from '@/lib/weekHelpers';

export default function SkeletonBoard() {
  return (
    <div className="grid grid-cols-7 gap-2 min-w-0">
      {WEEKDAY_SHORT.map((day) => (
        <div key={day} className="flex flex-col min-w-0">
          <div className="py-2 px-1 mb-2">
            <div className="skeleton h-3 w-8 mb-1" />
            <div className="skeleton h-5 w-6" />
          </div>
          <div className="space-y-2 flex-1">
            {Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map((_, i) => (
              <div key={i} className="skeleton h-16 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
