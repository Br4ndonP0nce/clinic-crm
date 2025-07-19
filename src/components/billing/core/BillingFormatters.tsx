// components/billing/core/BillingFormatters.tsx
export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(amount || 0);

export const formatDate = (date: any): string => {
  if (!date) return "N/A";
  const jsDate = date.toDate ? date.toDate() : new Date(date);
  return jsDate.toLocaleDateString("es-MX");
};

export const formatDateRange = (start: Date, end: Date): string => {
  return `${start.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
  })} - ${end.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })}`;
};
