import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { formatFirebaseWriteError } from '../utils/firebaseErrors';
import { requireAuthenticatedUser } from './firestoreService';

export const ORDER_STATUSES = [
  'pendiente_pago',
  'pagado',
  'en_preparacion',
  'listo',
  'entregado',
  'cancelado',
];

export const PAYMENT_STATUSES = ['pendiente', 'pagado'];
export const PAYMENT_METHODS = [null, 'efectivo', 'tarjeta', 'transferencia', 'qr'];

const ORDERS_COLLECTION = 'orders';
const ORDER_COUNTERS_COLLECTION = 'orderCounters';

const requireOrderDb = () => {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase no esta configurado. Revisa las variables .env.');
  }
  return db;
};

const runAuthenticatedOrderWrite = async (operation, context) => {
  requireAuthenticatedUser();
  try {
    return await operation();
  } catch (error) {
    console.error(`Firebase order write failed: ${context}`, error);
    throw new Error(formatFirebaseWriteError(error));
  }
};

const cleanArray = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean);
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizePaymentMethod = (value) =>
  PAYMENT_METHODS.includes(value) ? value : null;

const normalizeStatus = (value, fallback = 'pendiente_pago') =>
  ORDER_STATUSES.includes(value || fallback)
    ? value || fallback
    : (() => {
        throw new Error(`Estado de pedido invalido: ${value}`);
      })();

const normalizePaymentStatus = (value, fallback = 'pendiente') =>
  PAYMENT_STATUSES.includes(value || fallback)
    ? value || fallback
    : (() => {
        throw new Error(`Estado de pago invalido: ${value}`);
      })();

export const getOrderDateId = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatOrderNumber = (sequence) =>
  String(Number(sequence || 0)).padStart(3, '0');

export const normalizeOrderItem = (item = {}) => {
  const quantity = Math.max(1, Number(item.quantity || 1));
  const unitPrice = Number(item.unitPrice || item.price || 0);
  const subtotal = Number(item.subtotal ?? quantity * unitPrice);

  return {
    productId: item.productId || item.id || '',
    name: item.name || '',
    category: item.category || item.categoryName || '',
    quantity,
    unitPrice,
    subtotal,
    modifiers: cleanArray(item.modifiers),
    note: item.note || '',
  };
};

export const normalizeOrderPayload = (payload = {}) => {
  const items = (payload.items || []).map(normalizeOrderItem);
  const total = Number(payload.total ?? items.reduce((sum, item) => sum + item.subtotal, 0));
  const status = normalizeStatus(payload.status);
  const paymentStatus = normalizePaymentStatus(
    payload.paymentStatus,
    status === 'pagado' ? 'pagado' : 'pendiente',
  );

  return {
    orderNumber: payload.orderNumber || '',
    customerName: String(payload.customerName || payload.orderName || '').trim(),
    takeAway: Boolean(payload.takeAway),
    status,
    items,
    total,
    paymentStatus,
    paymentMethod: normalizePaymentMethod(payload.paymentMethod),
    note: payload.note || '',
    createdBy: payload.createdBy || 'barista',
    source: payload.source || 'barista_panel',
  };
};

const normalizeOrderUpdatePayload = (payload = {}) => {
  const update = { ...payload };

  if ('items' in update) {
    update.items = update.items.map(normalizeOrderItem);
    update.total = Number(update.total ?? update.items.reduce((sum, item) => sum + item.subtotal, 0));
  } else if ('total' in update) {
    update.total = Number(update.total || 0);
  }

  if ('status' in update) update.status = normalizeStatus(update.status, null);
  if ('paymentStatus' in update) update.paymentStatus = normalizePaymentStatus(update.paymentStatus, null);
  if ('paymentMethod' in update) update.paymentMethod = normalizePaymentMethod(update.paymentMethod);
  if ('customerName' in update || 'orderName' in update) {
    update.customerName = String(update.customerName || update.orderName || '').trim();
    delete update.orderName;
  }
  if ('takeAway' in update) update.takeAway = Boolean(update.takeAway);

  return update;
};

export const orderService = {
  list: async () => {
    const database = requireOrderDb();
    const snapshot = await getDocs(query(collection(database, ORDERS_COLLECTION), orderBy('createdAt', 'desc')));
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  },

  get: async (id) => {
    const database = requireOrderDb();
    const snapshot = await getDoc(doc(database, ORDERS_COLLECTION, id));
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
  },

  create: async (payload = {}) => {
    const database = requireOrderDb();
    const orderDate = payload.orderDate || getOrderDateId();

    return runAuthenticatedOrderWrite(async () => {
      const counterRef = doc(database, ORDER_COUNTERS_COLLECTION, orderDate);
      const orderRef = doc(collection(database, ORDERS_COLLECTION));

      return runTransaction(database, async (transaction) => {
        const counterSnapshot = await transaction.get(counterRef);
        const nextSequence = Number(counterSnapshot.data()?.lastNumber || 0) + 1;
        const orderNumber = formatOrderNumber(nextSequence);
        const order = normalizeOrderPayload({
          ...payload,
          orderNumber,
        });
        const timestamp = serverTimestamp();

        transaction.set(
          counterRef,
          {
            date: orderDate,
            lastNumber: nextSequence,
            updatedAt: timestamp,
          },
          { merge: true },
        );
        transaction.set(orderRef, {
          ...order,
          orderDate,
          orderSequence: nextSequence,
          createdAt: timestamp,
          updatedAt: timestamp,
        });

        return {
          id: orderRef.id,
          orderNumber,
          orderDate,
          orderSequence: nextSequence,
        };
      });
    }, 'create order');
  },

  update: async (id, payload) => {
    const database = requireOrderDb();
    const update = normalizeOrderUpdatePayload(payload);
    return runAuthenticatedOrderWrite(
      () =>
        setDoc(
          doc(database, ORDERS_COLLECTION, id),
          {
            ...update,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        ),
      `update order ${id}`,
    );
  },

  updateStatus: (id, status) =>
    orderService.update(id, { status }),

  updatePayment: (id, { paymentStatus = 'pagado', paymentMethod = null } = {}) =>
    orderService.update(id, {
      paymentStatus,
      paymentMethod,
      ...(paymentStatus === 'pagado' ? { status: 'pagado' } : {}),
    }),

  cancel: (id) =>
    orderService.update(id, {
      status: 'cancelado',
    }),
};
