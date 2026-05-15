import { formatPrice } from './format';

export const normalizeWhatsAppNumber = (value = '') =>
  value
    .toString()
    .replace(/\D/g, '');

const getOrderDisplayNumber = (orderNumber) =>
  orderNumber ? `#${String(orderNumber).replace(/^0+/, '') || orderNumber}` : '#---';

export const buildOrderWhatsAppMessage = ({
  orderNumber,
  customerName = '',
  takeAway = false,
  items = [],
  total = 0,
  note = '',
} = {}) => {
  const lines = [
    'Nuevo pedido Nirvana',
    `Pedido ${getOrderDisplayNumber(orderNumber)}`,
  ];

  if (customerName.trim()) lines.push(`Nombre: ${customerName.trim()}`);
  lines.push(`Tipo: ${takeAway ? 'Para llevar' : 'En local'}`);
  lines.push('', 'Productos:');

  items.forEach((item) => {
    const quantity = Number(item.quantity || 0);
    const unitPrice = Number(item.unitPrice || 0);
    const subtotal = Number(item.subtotal || quantity * unitPrice);
    const priceText = quantity > 1
      ? `${formatPrice(unitPrice)} c/u`
      : formatPrice(subtotal);
    lines.push(`- ${quantity}x ${item.name} \u2014 ${priceText}`);

    const details = [...(item.modifiers || []), item.note].filter(Boolean);
    if (details.length) lines.push(`  ${details.join(' \u00b7 ')}`);
  });

  lines.push('', `Total: ${formatPrice(total)} Gs`);

  if (note.trim()) {
    lines.push('', 'Observaci\u00f3n:', note.trim());
  }

  return lines.join('\n');
};

export const buildOrderWhatsAppUrl = (phoneNumber, order) => {
  const normalizedNumber = normalizeWhatsAppNumber(phoneNumber);
  if (!normalizedNumber) return '';

  return `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(buildOrderWhatsAppMessage(order))}`;
};
