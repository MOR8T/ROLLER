import Image from "next/image";
import { cn } from "@/lib/utils";

interface MediaFrameProps {
  src?: string | null;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
  fill?: boolean;
  objectFit?: "cover" | "contain";
  sizes?: string;
  onError?: () => void;
  /**
   * Shown inside the empty state instead of `alt`. Context photography
   * (interiors, facades, finished objects) does not exist yet — those slots
   * ship as data fields set to `null` and render this calm neutral panel until
   * the client's own shoot lands via the admin panel (DESIGN.md §6 п.2).
   */
  placeholderLabel?: string;
}

export function MediaFrame({
  src,
  alt = "Media placeholder",
  width = 600,
  height = 400,
  className,
  containerClassName,
  priority = false,
  fill = false,
  objectFit = "cover",
  sizes,
  onError,
  placeholderLabel,
}: MediaFrameProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden",
        fill
          ? "h-full w-full bg-neutral-100"
          : "rounded-card border border-neutral-200 bg-brand-white",
        containerClassName,
      )}
      style={fill ? undefined : { aspectRatio: `${width} / ${height}` }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className={cn(objectFit === "contain" ? "object-contain" : "object-cover", className)}
          priority={priority}
          sizes={sizes ?? (fill ? "100vw" : `(max-width: 640px) 100vw, ${width}px`)}
          onError={onError}
        />
      ) : (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center bg-neutral-100 p-6",
            "bg-[repeating-linear-gradient(135deg,transparent_0_14px,rgba(29,29,27,0.035)_14px_28px)]",
            className,
          )}
        >
          <p className="max-w-56 text-center text-xs leading-5 font-medium text-neutral-500">
            {placeholderLabel ?? alt}
          </p>
        </div>
      )}
    </div>
  );
}
