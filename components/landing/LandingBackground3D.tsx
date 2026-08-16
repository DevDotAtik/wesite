const CUBE_FACES = ["front", "back", "left", "right", "top", "bottom"] as const;

export default function LandingBackground3D() {
  return (
    <div className="nb-bg3d" aria-hidden="true">
      <div className="nb-bg3d-scene">
        {/* Perspective grid floor */}
        <div className="nb-bg3d-grid" />

        {/* Large rotating wireframe cube */}
        <div className="nb-cube3d nb-cube3d-lg nb-cube3d-blue">
          {CUBE_FACES.map((face) => (
            <span key={face} className={`nb-cube3d-face nb-cube3d-face-${face}`} />
          ))}
        </div>

        {/* Small rotating cube */}
        <div className="nb-cube3d nb-cube3d-sm nb-cube3d-pink">
          {CUBE_FACES.map((face) => (
            <span key={face} className={`nb-cube3d-face nb-cube3d-face-${face}`} />
          ))}
        </div>

        {/* 3D rings */}
        <div className="nb-ring nb-ring-1" />
        <div className="nb-ring nb-ring-2" />

        {/* Floating accent shapes */}
        <span className="nb-shape nb-shape-1" />
        <span className="nb-shape nb-shape-2" />
        <span className="nb-shape nb-shape-3" />
        <span className="nb-shape nb-shape-4" />
      </div>

      {/* Backdrop blur + tint overlay */}
      <div className="nb-bg3d-blur" />
    </div>
  );
}