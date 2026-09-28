import Image from "next/image";

type LogoProps = {
  className?: string;
  /** Kept for backwards compatibility — the new mark has fixed colors. */
  tone?: "brand" | "inverse";
  title?: string;
};

export default function Logo({ className = "size-8", title = "Wesite" }: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt={title}
      width={96}
      height={96}
      className={className}
      priority={false}
    />
  );
}
