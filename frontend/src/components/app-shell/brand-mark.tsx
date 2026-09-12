export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand" aria-label="RASID">
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      {!compact && (
        <span className="brand-wordmark" dir="ltr">
          RASID
        </span>
      )}
    </div>
  );
}
