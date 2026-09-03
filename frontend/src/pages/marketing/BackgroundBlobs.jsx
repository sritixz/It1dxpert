// BackgroundBlobs — soft, slow-drifting blurred gradient shapes behind the
// hero. Pure CSS animation (not framer-motion) since this runs
// continuously and forever — no reason to pay JS re-render cost for
// something that never needs to respond to state.

export function BackgroundBlobs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-bg" aria-hidden="true">
      {/* Crisp vertical and horizontal dividers for clean structure */}
      <div className="absolute left-1/4 top-0 h-full w-[1px] bg-border" />
      <div className="absolute left-2/4 top-0 h-full w-[1px] bg-border" />
      <div className="absolute left-3/4 top-0 h-full w-[1px] bg-border" />
      <div className="absolute top-1/4 left-0 w-full h-[1px] bg-border" />
      <div className="absolute top-2/4 left-0 w-full h-[1px] bg-border" />
      <div className="absolute top-3/4 left-0 w-full h-[1px] bg-border" />
    </div>
  );
}
