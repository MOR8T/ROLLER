"use client";

import { useState } from "react";

import { HomeCarousel } from "@/components/sections/home-carousel";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import type { AboutCertificateDto } from "@/lib/about";

/**
 * Certificate scans as a looping slider — same `HomeCarousel` the partner
 * logos use on `/about`, so the two "trust" strips on this page move the
 * same way. Photos only, no title under the thumbnail (2026-08-27, client
 * request); `title` still backs the `alt` text and the lightbox caption,
 * just nothing rendered on the card itself. Managed from the admin panel
 * (`AboutCertificatesManager`) since 2026-08-27 — `certificates` comes from
 * `lib/about.ts`'s `getAboutCertificates`.
 */
export function CertificatesGallery({
  certificates,
  label,
}: {
  certificates: AboutCertificateDto[];
  label: string;
}) {
  const [openSrc, setOpenSrc] = useState<string | null>(null);
  const openCert = certificates.find((cert) => cert.imageSrc === openSrc);

  return (
    <>
      <HomeCarousel
        label={label}
        perView={[2, 3, 4]}
        gap={16}
        autoplayDelay={4000}
        className="mt-10"
        slides={certificates.map((cert) => ({
          key: String(cert.id),
          node: (
            <button
              type="button"
              onClick={() => setOpenSrc(cert.imageSrc)}
              className="block aspect-[3/4] w-full overflow-hidden rounded-card border border-brand-black/10 bg-surface-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cert.imageSrc}
                alt={cert.title}
                className="h-full w-full object-cover transition duration-300 hover:scale-105"
              />
            </button>
          ),
        }))}
      />

      <ImageLightbox src={openSrc} alt={openCert?.title ?? ""} onClose={() => setOpenSrc(null)} />
    </>
  );
}
