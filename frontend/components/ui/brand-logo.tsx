import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  isDark?: boolean;
  className?: string;
}

export function BrandLogo({ isDark = false, className }: BrandLogoProps) {
  const logoSrc = isDark ? "/logos/roller_black.svg" : "/logos/roller_white.svg";
  const logoAlt = isDark ? "ROLLER (dark)" : "ROLLER (light)";

  return (
    <Image
      src={logoSrc}
      alt={logoAlt}
      width={280}
      height={60}
      className={cn("h-[40px] w-auto", className)}
      priority
    />
  );
}
