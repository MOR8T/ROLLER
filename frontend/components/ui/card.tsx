import { cn } from "@/lib/utils";

type CardVariant = "default" | "elevated" | "bordered";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

/**
 * Card component with three variants using brand tokens.
 * - default: Neutral background with light border
 * - elevated: White background with shadow depth
 * - bordered: White background with prominent brand-black border
 */
export function Card({
  variant = "default",
  className,
  ...props
}: CardProps) {
  const baseStyles = "rounded-lg transition-shadow";

  const variantStyles: Record<CardVariant, string> = {
    default:
      "bg-neutral-50 border border-neutral-200",
    elevated:
      "bg-brand-white shadow-md hover:shadow-lg",
    bordered:
      "bg-brand-white border-2 border-brand-black",
  };

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}
    />
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardHeader({ className, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn("px-6 py-4 border-b border-neutral-200", className)}
      {...props}
    />
  );
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardContent({ className, ...props }: CardContentProps) {
  return <div className={cn("px-6 py-4", className)} {...props} />;
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardFooter({ className, ...props }: CardFooterProps) {
  return (
    <div
      className={cn("px-6 py-4 border-t border-neutral-200", className)}
      {...props}
    />
  );
}
