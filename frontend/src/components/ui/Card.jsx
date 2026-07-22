export function Card({ className = "", children, ...props }) {
  return (
    <div className={`rounded-card border border-border bg-surface p-5 shadow-card ${className}`} {...props}>
      {children}
    </div>
  );
}
