type LogoProps = {
  className?: string;
  /** brand: blue ribbon on any background. inverse: white ribbon for blue backgrounds. */
  tone?: "brand" | "inverse";
  title?: string;
};

export default function Logo({ className = "size-8", tone = "brand", title = "Wesite" }: LogoProps) {
  const ribbon = tone === "brand" ? "#3b82f6" : "#ffffff";
  const letter = tone === "brand" ? "#ffffff" : "#3b82f6";

  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label={title}>
      <path
        d="M13 4h38v50.6c0 1.7-1.9 2.7-3.4 1.8L32 46.6 16.4 56.4c-1.5.9-3.4-.1-3.4-1.8z"
        fill={ribbon}
      />
      <text
        x="32"
        y="27"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="23"
        fontWeight="900"
        fill={letter}
      >
        W
      </text>
    </svg>
  );
}
