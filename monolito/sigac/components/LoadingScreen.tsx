'use client';

export default function LoadingScreen({ label = 'Cargando' }: { label?: string }) {
  return (
    <div className="ui-loading-root">
      <div className="ui-loading-inner">
        <div className="ui-spinner" aria-hidden />
        <p className="ui-loading-label">{label}</p>
      </div>
    </div>
  );
}
