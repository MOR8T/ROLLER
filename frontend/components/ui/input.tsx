import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, type = "text", ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        "h-12 w-full rounded-xl border border-brand-black/15 px-4 text-sm transition-colors outline-none focus:border-brand-red",
        className,
      )}
      {...props}
    />
  );
}
