export default function SkeletonBoard() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-5">
      {Array.from({ length: 7 }, (_, col) => (
        <div key={col} className="flex flex-col gap-2">
          <div className="mb-1 pb-2 border-b border-zinc-200 dark:border-zinc-800 flex items-end justify-between">
            <div>
              <div className="skeleton h-2.5 w-7 mb-2" />
              <div className="skeleton h-7 w-7" />
            </div>
            <div className="skeleton h-5 w-5 rounded-md mb-0.5" />
          </div>
          {Array.from({ length: [3, 2, 1, 2, 3, 1, 2][col] }, (_, row) => (
            <div
              key={row}
              className="skeleton rounded-lg"
              style={{
                height: row === 0 ? '58px' : '44px',
                animationDelay: `${(col * 3 + row) * 70}ms`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
