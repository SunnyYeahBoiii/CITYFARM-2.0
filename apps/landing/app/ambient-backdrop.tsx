export function AmbientBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div className="ambient-gradient-shift absolute inset-0 opacity-90" />
      <div className="ambient-mesh absolute -left-1/4 top-[-20%] h-[55%] w-[70%] rounded-[50%] blur-3xl ambient-blob-a" />
      <div className="ambient-mesh absolute -right-1/4 top-[10%] h-[45%] w-[60%] rounded-[50%] blur-3xl ambient-blob-b" />
      <div className="ambient-mesh absolute bottom-[-25%] left-[15%] h-[50%] w-[75%] rounded-[50%] blur-3xl ambient-blob-c" />
      <div className="ambient-grid absolute inset-0 opacity-[0.14]" />
      <div className="ambient-shooting-star" />
      <div className="ambient-dust">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="ambient-vignette absolute inset-0" />
    </div>
  );
}
