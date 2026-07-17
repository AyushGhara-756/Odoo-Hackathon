import { cn } from "@/lib/utils";
import type { TripStatus } from "@/lib/types";

const STEPS: TripStatus[] = ["Draft", "Dispatched", "Completed", "Cancelled"];

function HorizontalStepper({
  steps,
  currentIndex,
  isCancelled,
}: {
  steps: TripStatus[];
  currentIndex: number;
  isCancelled: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {steps.filter((s) => s !== "Cancelled").map((step, i) => {
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

function VerticalStepper({
  steps,
  currentIndex,
  isCancelled,
}: {
  steps: TripStatus[];
  currentIndex: number;
  isCancelled: boolean;
}) {
  return (
    <div className="flex flex-col gap-0">
      {steps.filter((s) => s !== "Cancelled").map((step, i) => {
        const isActive = i === currentIndex;
        const isPast = i < currentIndex && !isCancelled;
        return (
          <div key={step} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "h-3 w-3 rounded-full border-2",
                  isActive && "border-blue-500 bg-blue-500",
                  isPast && "border-green-500 bg-green-500",
                  !isActive && !isPast && "border-muted-foreground bg-transparent"
                )}
              />
              {i < STEPS.length - 2 && (
                <div
                  className={cn(
                    "mt-0.5 w-px flex-1",
                    isPast ? "bg-green-500" : "bg-border"
                  )}
                  style={{ minHeight: 16 }}
                />
              )}
            </div>
            <span
              className={cn(
                "text-sm",
                isActive ? "text-foreground font-medium" : "text-muted-foreground"
              )}
            >
              {step}
            </span>
          </div>
        );
      })}
      {isCancelled && (
        <span className="mt-1 text-xs font-medium text-red-500">Cancelled</span>
      )}
    </div>
  );
}

export function TripStepper({ currentStatus }: { currentStatus: TripStatus }) {
  const currentIndex = STEPS.indexOf(currentStatus);
  const isCancelled = currentStatus === "Cancelled";

  return (
    <>
      <div className="hidden sm:block">
        <HorizontalStepper steps={STEPS} currentIndex={currentIndex} isCancelled={isCancelled} />
      </div>
      <div className="sm:hidden">
        <VerticalStepper steps={STEPS} currentIndex={currentIndex} isCancelled={isCancelled} />
      </div>
    </>
  );
}
