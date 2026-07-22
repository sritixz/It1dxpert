// Button — one component, a few variants. Kept intentionally small: this
// app needs consistency more than flexibility at this stage.

const VARIANTS = {
  primary: "bg-primary text-white hover:bg-primary-dark",
  secondary: "bg-white text-ink border border-border hover:bg-bg",
  ghost: "bg-transparent text-muted hover:text-ink hover:bg-bg",
};

export function Button({ variant = "primary", className = "", isLoading = false, children, disabled, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-display font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
