import { useEffect, useMemo } from 'react';

const radiusMap = {
  small: '16px',
  medium: '22px',
  large: '30px',
};

const themePalette = {
  light: {
    accent: '#B87934',
    accentDark: '#A9682E',
    background: '#F7F1EA',
  },
  dark: {
    accent: '#B87935',
    accentDark: '#A9682E',
    background: '#14110E',
  },
};

export default function ThemeWrapper({ settings, children }) {
  const themeMode = settings.themeMode === 'dark' ? 'dark' : 'light';
  const palette = themePalette[themeMode];

  const style = useMemo(
    () => ({
      '--accent': palette.accent,
      '--accent-dark': palette.accentDark,
      '--bg': palette.background,
      '--radius-card': radiusMap[settings.borderRadius] || radiusMap.large,
      '--product-shadow-choice': `var(--product-shadow-${settings.productShadowIntensity || 'medium'})`,
    }),
    [palette, settings.borderRadius, settings.productShadowIntensity],
  );

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
  }, [themeMode]);

  return (
    <div
      className="theme-shell"
      data-theme={themeMode}
      data-shadow={settings.productShadowIntensity || 'medium'}
      style={style}
    >
      {children}
    </div>
  );
}
