import {
  CakeSlice,
  Coffee,
  CupSoda,
  Leaf,
  Snowflake,
  Sparkles,
  Wheat,
} from 'lucide-react';

export const iconMap = {
  CakeSlice,
  Coffee,
  CupSoda,
  Leaf,
  Snowflake,
  Sparkles,
  Wheat,
};

export const DynamicIcon = ({ name, size = 18 }) => {
  const Icon = iconMap[name] || Coffee;
  return <Icon size={size} strokeWidth={1.7} />;
};

const svgProps = {
  className: 'category-main-icon category-premium-icon',
  viewBox: '0 0 48 48',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.25,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  focusable: 'false',
};

function PremiumCoffeeIcon() {
  return (
    <svg {...svgProps}>
      <g className="premium-icon-scale">
        <path className="icon-steam icon-steam--one" d="M18 7.5c-1.6 1.8-1.6 3.6 0 5.4" />
        <path className="icon-steam icon-steam--two" d="M24 6.5c-1.8 2.2-1.8 4.2 0 6.2" />
        <path className="icon-steam icon-steam--three" d="M30 7.5c-1.6 1.8-1.6 3.6 0 5.4" />
        <path d="M13.5 18.5h19v9.1a8 8 0 0 1-8 8h-3a8 8 0 0 1-8-8v-9.1Z" />
        <path d="M32.5 21h2.2a4.4 4.4 0 0 1 0 8.8h-2.2" />
        <path d="M13 39.5h23" />
        <path d="M17 35.6c1.8 1.6 4 2.4 6.5 2.4s4.7-.8 6.5-2.4" opacity="0.68" />
      </g>
    </svg>
  );
}

function PremiumIcedCoffeeIcon() {
  return (
    <svg {...svgProps}>
      <g className="premium-icon-scale">
        <path d="M15.5 10.5h17" />
        <path d="M17.5 14.5h13l-1.6 24h-9.8l-1.6-24Z" />
        <path d="M18.6 20h10.8" opacity="0.58" />
        <path d="M19.2 31h9.6" opacity="0.42" />
        <path className="ice-cube ice-cube--one" d="M20.6 22.3h4.3v4.3h-4.3z" />
        <path className="ice-cube ice-cube--two" d="M25.3 27.2h4v4h-4z" />
        <path className="ice-cube ice-cube--three" d="M20.8 31.1h3.7v3.7h-3.7z" />
        <path className="cold-drop cold-drop--one" d="M35.2 20.3c1.3 1.4 1.3 3 0 4.4" opacity="0.5" />
        <path className="cold-drop cold-drop--two" d="M12.8 23.5c-1.1 1.2-1.1 2.6 0 3.8" opacity="0.42" />
      </g>
    </svg>
  );
}

function PremiumEmpanadaIcon() {
  return (
    <svg {...svgProps}>
      <g className="premium-icon-scale">
        <path className="icon-steam icon-steam--one" d="M19 7.5c-1.4 1.7-1.4 3.3 0 4.9" />
        <path className="icon-steam icon-steam--two" d="M25 6.6c-1.6 2-1.6 3.8 0 5.7" />
        <path className="icon-steam icon-steam--three" d="M31 7.8c-1.3 1.6-1.3 3.1 0 4.6" />
        <path d="M10.8 32.8c2.3-8.7 8.3-14.1 17.5-15.5 5.2 1.9 8.6 5.3 9.9 10.1-4.6 6.9-17.9 9.7-27.4 5.4Z" />
        <path d="M15.2 31.2c1.2-4.4 5.4-8.3 12.8-9.9 3.5 1.3 5.8 3.3 7 6" opacity="0.52" />
        <path d="M16.8 26.9c1.5 1 3 1.5 4.5 1.6" />
        <path d="M22.2 23.6c1.3 1.1 2.8 1.7 4.4 1.8" />
        <path d="M28.3 22.5c1.2.9 2.4 1.4 3.8 1.6" />
      </g>
    </svg>
  );
}

function PremiumCakeIcon() {
  return (
    <svg {...svgProps}>
      <g className="premium-icon-scale">
        <path className="cake-sparkle cake-sparkle--one" d="M13 10v4M11 12h4" />
        <path className="cake-sparkle cake-sparkle--two" d="M36 12v3M34.5 13.5h3" />
        <path className="cake-sparkle cake-sparkle--three" d="M32.5 34v3M31 35.5h3" />
        <path d="M10.8 20.5 31.5 15l6.2 7.6-20.5 6.5-6.4-8.6Z" />
        <path d="M17.2 29.1v9.2l20.5-6.5v-9.2" />
        <path d="M10.8 20.5v9.2l6.4 8.6" />
        <path d="M14 25.1 34.6 19" opacity="0.46" />
        <path d="M17.2 33.4 37.7 26.9" opacity="0.42" />
      </g>
    </svg>
  );
}

function PremiumLeafIcon() {
  return (
    <svg {...svgProps}>
      <g className="premium-icon-scale leaf-fall">
        <path d="M35.8 12.2C23.2 12.5 13.7 19.3 12.4 31c8.3 2.2 18.1-2.5 21.7-11.4 1-2.4 1.5-4.8 1.7-7.4Z" />
        <path d="M13.2 31.2c6.6-6.2 12.5-9.6 20.1-11.4" opacity="0.72" />
        <path d="M22.4 24.3c-.4-2.2-1.2-4-2.4-5.4" opacity="0.48" />
        <path d="M27.9 21.6c.2 2.3.8 4.2 1.8 5.7" opacity="0.48" />
      </g>
    </svg>
  );
}

const premiumIconMap = {
  Coffee: PremiumCoffeeIcon,
  CupSoda: PremiumIcedCoffeeIcon,
  Snowflake: PremiumIcedCoffeeIcon,
  Wheat: PremiumEmpanadaIcon,
  CakeSlice: PremiumCakeIcon,
  Sparkles: PremiumCakeIcon,
  Leaf: PremiumLeafIcon,
};

export const AnimatedCategoryIcon = ({ name, active = false }) => {
  const Icon = premiumIconMap[name] || PremiumCoffeeIcon;

  return (
    <span
      className={`category-icon-shell ${active ? 'is-active' : ''}`}
      aria-hidden="true"
    >
      <Icon />
    </span>
  );
};
