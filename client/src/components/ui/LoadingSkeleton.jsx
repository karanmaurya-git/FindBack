import React from 'react';

export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 overflow-hidden animate-pulse shadow-sm">
      <div className="w-full h-48 bg-slate-200 dark:bg-slate-800 rounded-xl mb-4" />
      <div className="flex gap-2 mb-3">
        <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
        <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
      </div>
      <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
      <div className="h-4 w-full bg-slate-100 dark:bg-slate-800/60 rounded mb-4" />
      <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-8 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
