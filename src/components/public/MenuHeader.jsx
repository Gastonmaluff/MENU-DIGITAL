import { Bean } from 'lucide-react';

export default function MenuHeader({ settings }) {
  return (
    <header className="menu-header">
      {settings.logoUrl ? (
        <img className="brand-logo" src={settings.logoUrl} alt={`${settings.brandName} ${settings.brandSubtitle}`} />
      ) : (
        <>
          <h1>{settings.brandName}</h1>
          <p>{settings.brandSubtitle}</p>
        </>
      )}
      <div className="menu-title-block">
        <h2>{settings.menuTitle}</h2>
        <span>{settings.menuSubtitle}</span>
      </div>
      <div className="ornament" aria-hidden="true">
        <span />
        <Bean size={32} strokeWidth={1.3} />
        <span />
      </div>
    </header>
  );
}
