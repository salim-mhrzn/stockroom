const formatter = new Intl.NumberFormat("en-NP", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(value) {
  return `Rs. ${formatter.format(Number(value) || 0)}`;
}