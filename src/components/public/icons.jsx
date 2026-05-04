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

export const AnimatedCategoryIcon = ({ name, active = false }) => {
  const Icon = iconMap[name] || Coffee;
  const animation = name === 'Coffee' ? 'steam' : 'ready';

  return (
    <span
      className={`category-icon-shell ${active ? 'is-active' : ''}`}
      data-animation={animation}
      aria-hidden="true"
    >
      {animation === 'steam' && (
        <span className="coffee-steam">
          <i />
          <i />
          <i />
        </span>
      )}
      <Icon size={18} strokeWidth={1.75} />
    </span>
  );
};
