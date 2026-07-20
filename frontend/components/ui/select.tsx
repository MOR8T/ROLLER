import { cn } from "@/lib/utils";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export function Select({ className, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "h-12 w-full rounded-xl border border-brand-black/15 px-4 text-sm transition-colors outline-none focus:border-brand-red",
        className,
      )}
      {...props}
    />
  );
}
