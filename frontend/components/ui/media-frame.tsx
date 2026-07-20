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
}

export function MediaFrame({
  src,
  alt = "Media placeholder",
  width = 600,
  height = 400,
  className,
  containerClassName,
  priority = false,
}: MediaFrameProps) {
  const aspectRatio = width && height ? `${(height / width) * 100}%` : "66.67%";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-neutral-200 bg-brand-white",
        containerClassName
      )}
      style={{
        aspectRatio: `${width} / ${height}`,
      }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className={cn("object-cover", className)}
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1000px"
        />
      ) : (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(211,0,26,0.12)_0%,rgba(211,0,26,0.06)_50%,rgba(29,29,27,0.08)_100%)]",
            className
          )}
        >
          <div className="text-center">
            <div className="text-sm font-medium text-neutral-500">
              Изображение не загружено
            </div>
            <div className="mt-1 text-xs text-neutral-400">
              {alt}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
