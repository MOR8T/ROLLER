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
}: MediaFrameProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden",
        fill
          ? "h-full w-full bg-brand-black"
          : "rounded-xl border border-neutral-200 bg-brand-white",
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
            "flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(211,0,26,0.12)_0%,rgba(211,0,26,0.06)_50%,rgba(29,29,27,0.08)_100%)]",
            className,
          )}
        >
          <div className="text-center">
            <div className="text-sm font-medium text-neutral-500">Изображение не загружено</div>
            <div className="mt-1 text-xs text-neutral-400">{alt}</div>
          </div>
        </div>
      )}
    </div>
  );
}
