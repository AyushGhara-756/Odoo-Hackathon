import { cn } from "@/lib/utils";
import type { TripStatus } from "@/lib/types";

const STEPS: TripStatus[] = ["Draft", "Dispatched", "Completed", "Cancelled"];

export function TripStepper({ currentStatus }: { currentStatus: TripStatus }) {
  const currentIndex = STEPS.indexOf(currentStatus);
  const isCancelled = currentStatus === "Cancelled";

  return (
    <div className="flex items-center gap-2">
      {STEPS.filter((s) => s !== "Cancelled").map((step, i) => {
        const isActive = i === currentIndex;
        const isPast = i < currentIndex && !isCancelled;
        return (
          <div key={step} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "h-3 w-3 rounded-full border-2",
                  isActive && "border-blue-500 bg-blue-500",
                  isPast && "border-green-500 bg-green-500",
                  !isActive && !isPast && "border-muted-foreground bg-transparent"
                )}
              />
              <span
                className={cn(
                  "text-xs",
                  isActive ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {step}
              </span>
            </div>
            {i < STEPS.length - 2 && <div className="h-px w-8 bg-border" />}
          </div>
        );
      })}
      {isCancelled && (
        <span className="ml-2 text-xs font-medium text-red-500">Cancelled</span>
      )}
    </div>
  );
}
