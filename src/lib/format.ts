const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** ₹1,450 — Indian digit grouping. */
export const rupee = (n: number) => `₹${inr.format(n)}`;
