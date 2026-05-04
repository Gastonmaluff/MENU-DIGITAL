import { useEffect, useMemo } from 'react';

const radiusMap = {
  small: '16px',
  medium: '22px',
  large: '30px',
};

export default function ThemeWrapper({ settings, children }) {
  const style = useMemo(
    () => ({
      '--accent': settings.primaryColor || '#B87934',
      '--accent-dark': settings.primaryColor || '#A9682E',
      '--bg': settings.themeMode === 'dark'
        ? settings.darkBackgroundColor || '#0D0D0F'
        : settings.backgroundColor || '#F7F1EA',
      '--radius-card': radiusMap[settings.borderRadius] || radiusMap.large,
      '--product-shadow-choice': `var(--product-shadow-${settings.productShadowIntensity || 'medium'})`,
    }),
    [settings],
  );

  useEffect(() => {
    document.documentElement.dataset.theme = settings.themeMode || 'light';
  }, [settings.themeMode]);

  return (
    <div
      className="theme-shell"
      data-theme={settings.themeMode || 'light'}
      data-shadow={settings.productShadowIntensity || 'medium'}
      style={style}
    >
      {children}
    </div>
  );
}
