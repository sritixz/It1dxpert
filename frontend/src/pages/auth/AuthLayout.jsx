import { GlucoseWave } from "../../assets/GlucoseWave.jsx";

export function AuthLayout({ eyebrow, title, subtitle, children }) {
  return (
    <div className="flex min-h-screen">
      {/* Brand panel — signature glucose-wave motif, hidden on small screens
          so mobile users go straight to the form. */}
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-ink px-12 py-12 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M2 12h20" strokeLinecap="round" />
            </svg>
          </div>
          <span className="font-display text-lg font-bold">DiabetesCare</span>
        </div>

        <div>
          <p className="mb-4 font-display text-3xl font-bold leading-tight">
            Every reading,
            <br />
            in one steady view.
          </p>
          <p className="max-w-sm font-body text-sm leading-relaxed text-white/70">
            Log glucose, insulin, meals, and activity in seconds — and give your care team
            the full picture between visits.
          </p>
        </div>

        <GlucoseWave className="w-full opacity-90" />
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center bg-bg px-6 py-12">
        <div className="w-full max-w-sm">
          {eyebrow && (
            <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-primary">{eyebrow}</p>
          )}
          <h1 className="mb-1.5 font-display text-2xl font-bold text-ink">{title}</h1>
          {subtitle && <p className="mb-8 font-body text-sm text-muted">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}
