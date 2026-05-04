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
