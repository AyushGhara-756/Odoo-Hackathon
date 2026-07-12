import { cn } from "@/lib/utils";

type StatusColor = "green" | "blue" | "orange" | "red" | "neutral";

const STATUS_COLOR_MAP: Record<string, StatusColor> = {
  Available: "green",
  Completed: "green",
  "On Trip": "blue",
  Dispatched: "blue",
  Draft: "blue",
  "In Shop": "orange",
  Scheduled: "orange",
  "Off Duty": "neutral",
  Retired: "red",
  Suspended: "red",
  Cancelled: "red",
};

const COLOR_CLASSES: Record<StatusColor, string> = {
  green: "bg-green-500/15 text-green-500 border-green-500/30",
  blue: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  orange: "bg-orange-500/15 text-orange-500 border-orange-500/30",
  red: "bg-red-500/15 text-red-500 border-red-500/30",
  neutral: "bg-neutral-500/15 text-neutral-400 border-neutral-500/30",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const color = STATUS_COLOR_MAP[status] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        COLOR_CLASSES[color],
        className
      )}
    >
      {status}
    </span>
  );
}
