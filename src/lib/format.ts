export const formatDate = (value?: string | Date | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
};

export const formatTime = (value?: string | Date | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
};

export const formatDateTime = (value?: string | Date | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return `${formatDate(value)}, ${formatTime(value)}`;
};

/**
 * Formats a phone number for WhatsApp links (digits only with country code, no + or symbols).
 * Defaults to India (+91) for standard 10-digit mobile numbers.
 */
export const formatWhatsAppPhone = (phone?: string): string => {
  if (!phone) return "";
  const cleaned = phone.replace(/[^\d]/g, "");
  if (!cleaned) return "";

  // If 10 digits, prepend 91 (standard Indian mobile format)
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }
  // If 11 digits starting with 0, replace 0 with 91
  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    return `91${cleaned.slice(1)}`;
  }
  // Already includes country code or international format
  return cleaned;
};

export interface WhatsAppDispatchParams {
  customerName: string;
  orderNumber: string;
  orderDate?: string | Date | null;
  dispatchDate?: string | Date | null;
  shippingAddress?: string;
  trackingNumber?: string;
  customerPhone?: string;
}

export const buildWhatsAppDispatchMessage = (params: WhatsAppDispatchParams): string => {
  const name = params.customerName || "Valued Customer";
  const orderNum = params.orderNumber || "-";
  const ordDate = params.orderDate ? formatDate(params.orderDate) : "Recent";
  const dispDate = params.dispatchDate ? formatDate(params.dispatchDate) : formatDate(new Date());
  const address = params.shippingAddress || "As registered in your order";
  const tracking = params.trackingNumber ? params.trackingNumber.trim() : "Standard Delivery (Tracking available on request)";

  return `Hello ${name},

Your order #${orderNum} has been dispatched successfully.

Order Date: ${ordDate}
Dispatch Date: ${dispDate}
Delivery Address: ${address}
Tracking Number: ${tracking}

Thank you for shopping with us!`;
};

export const buildWhatsAppDispatchUrl = (params: WhatsAppDispatchParams): string | null => {
  const phone = formatWhatsAppPhone(params.customerPhone);
  if (!phone) return null;
  const message = buildWhatsAppDispatchMessage(params);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};

export const formatCurrency = (value?: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);

export const getAddressText = (address?: string | { street?: string; city?: string; state?: string; postal_code?: string; country?: string }) => {
  if (!address) return "-";
  if (typeof address === "string") return address;
  return [address.street, address.city, address.state, address.postal_code, address.country].filter(Boolean).join(", ") || "-";
};

export const getAge = (dob?: string) => {
  if (!dob) return "-";
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return "-";
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age -= 1;
  return String(age);
};
