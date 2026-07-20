import { cn } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-brand-black/15 px-4 py-3 text-sm transition-colors outline-none focus:border-brand-red",
        className,
      )}
      {...props}
    />
  );
}
