import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  isDark?: boolean;
  className?: string;
}

export function BrandLogo({ isDark = false, className }: BrandLogoProps) {
  const logoSrc = isDark ? "/logos/logo-dark.png" : "/logos/logo-light.png";
  const logoAlt = isDark ? "ROLLER (dark)" : "ROLLER (light)";

  return (
    <Image
      src={logoSrc}
      alt={logoAlt}
      width={180}
      height={60}
      className={cn("h-auto w-auto", className)}
      priority
    />
  );
}
