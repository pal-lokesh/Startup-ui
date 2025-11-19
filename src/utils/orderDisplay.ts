import { Order } from '../types/cart';

type OrderLike = Pick<Order, 'orderId' | 'orderItems'> | {
  orderId?: string | number;
  orderItems?: Array<{ itemName?: string | null }>;
};

const DEFAULT_LABEL = 'Order';

const normalizeItems = (order?: OrderLike) => {
  const items = order?.orderItems ?? [];
  return items.filter((item) => item && typeof item.itemName === 'string' && item.itemName.trim().length > 0);
};

export const getOrderItemSummary = (order?: OrderLike): string => {
  const validItems = normalizeItems(order);
  if (!validItems.length) {
    return DEFAULT_LABEL;
  }

  const primaryName = validItems[0].itemName!.trim();
  const additionalCount = validItems.length - 1;

  if (additionalCount <= 0) {
    return primaryName;
  }

  return `${primaryName} + ${additionalCount} more item${additionalCount > 1 ? 's' : ''}`;
};

export const getOrderDisplayTitle = (order?: OrderLike): string => {
  const summary = getOrderItemSummary(order);
  if (summary !== DEFAULT_LABEL) {
    return summary;
  }

  if (order?.orderId !== undefined && order.orderId !== null) {
    return `Order #${order.orderId}`;
  }

  return DEFAULT_LABEL;
};

