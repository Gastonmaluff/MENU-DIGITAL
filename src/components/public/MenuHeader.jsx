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
    </header>
  );
}
