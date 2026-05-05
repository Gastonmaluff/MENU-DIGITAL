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

const categoryAnimationMap = {
  Coffee: 'coffee',
  Snowflake: 'iced',
  CupSoda: 'iced',
  Wheat: 'savory',
  CakeSlice: 'sweet',
  Sparkles: 'sweet',
  Leaf: 'leaf',
};

const categoryVisualIconMap = {
  Snowflake: CupSoda,
  CupSoda,
};

export const AnimatedCategoryIcon = ({ name, active = false }) => {
  const Icon = categoryVisualIconMap[name] || iconMap[name] || Coffee;
  const animation = categoryAnimationMap[name] || 'ready';

  return (
    <span
      className={`category-icon-shell ${active ? 'is-active' : ''}`}
      data-animation={animation}
      aria-hidden="true"
    >
      {animation === 'coffee' && (
        <span className="coffee-steam">
          <i />
          <i />
          <i />
        </span>
      )}
      {animation === 'savory' && (
        <span className="savory-steam">
          <i />
          <i />
        </span>
      )}
      {animation === 'iced' && (
        <span className="iced-motion">
          <i />
          <i />
          <b />
        </span>
      )}
      {animation === 'sweet' && (
        <span className="sweet-sparkles">
          <i />
          <i />
          <i />
        </span>
      )}
      {animation === 'leaf' && (
        <span className="leaf-drift">
          <i />
        </span>
      )}
      <Icon className="category-main-icon" size={34} strokeWidth={1.6} />
    </span>
  );
};
