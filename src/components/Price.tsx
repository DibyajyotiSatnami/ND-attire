import { rupee } from "@/lib/format";

export function Price({ value, className = "" }: { value: number | null; className?: string }) {
  return value === null ? (
    <span className={`font-medium text-tea ${className}`}>Price on request</span>
  ) : (
    <span className={`display text-gamosa ${className}`}>{rupee(value)}</span>
  );
}
