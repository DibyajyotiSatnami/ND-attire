import { rupee } from "@/lib/format";

export function Price({ value, className = "" }: { value: number | null; className?: string }) {
  return value === null ? (
    <span className={`font-medium text-teal ${className}`}>Price on request</span>
  ) : (
    <span className={`display text-rose ${className}`}>{rupee(value)}</span>
  );
}
