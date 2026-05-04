import { Bean } from 'lucide-react';
import { resolveAssetUrl } from '../../utils/assets';

export default function MenuHeader({ settings }) {
  const logoUrl = resolveAssetUrl(settings.logoUrl);

  return (
    <header className="menu-header">
      {logoUrl ? (
        <img className="brand-logo" src={logoUrl} alt={`${settings.brandName} ${settings.brandSubtitle}`} loading="eager" decoding="async" />
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
