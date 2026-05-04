import { Coffee } from 'lucide-react';
import ProductImage from '../public/ProductImage';
import ThemeWrapper from '../public/ThemeWrapper';

export default function AdminPreview({ settings }) {
  return (
    <ThemeWrapper settings={settings}>
      <div className="admin-menu-preview">
        <div>
          <h3>{settings.brandName}</h3>
          <span>{settings.menuTitle}</span>
        </div>
        <article>
          <div>
            <strong>Cappuccino</strong>
            <p>cremoso, canela</p>
            <b>24.000</b>
          </div>
          <ProductImage size="small" src="/assets/cappuccino.png" alt="Cappuccino" />
        </article>
        <button type="button"><Coffee size={16} /> Cafés</button>
      </div>
    </ThemeWrapper>
  );
}
