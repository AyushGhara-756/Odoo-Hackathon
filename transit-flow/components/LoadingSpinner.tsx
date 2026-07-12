export function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-orange-500" />
    </div>
  );
}
