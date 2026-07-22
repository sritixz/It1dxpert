// Input — labeled field with inline error text. Errors describe what
// happened and how to fix it (per the copy guidance), never vague.

export function Input({ label, error, id, className = "", ...props }) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="font-body text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-lg border px-3.5 py-2.5 font-body text-sm text-ink placeholder:text-muted/60 focus:border-primary transition-colors ${
          error ? "border-critical" : "border-border"
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-critical">{error}</p>}
    </div>
  );
}
