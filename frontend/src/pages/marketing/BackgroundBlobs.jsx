// BackgroundBlobs — soft, slow-drifting blurred gradient shapes behind the
// hero. Pure CSS animation (not framer-motion) since this runs
// continuously and forever — no reason to pay JS re-render cost for
// something that never needs to respond to state.

export function BackgroundBlobs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -left-24 -top-24 h-96 w-96 animate-blob rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -right-16 top-10 h-80 w-80 animate-blob-delay rounded-full bg-success/15 blur-3xl" />
      {/* Faint dot grid for texture — very low opacity, purely tactile */}
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: "radial-gradient(circle, #16233A12 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
    </div>
  );
}
