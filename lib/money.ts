export function normalizeEmail(value?: string | null): string {
  return value?.trim().toLowerCase() ?? "";
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function normalizeAmount(value: string | number | undefined): string {
  const amount = String(value ?? "").trim();

  if (!amount) {
    return "";
  }

  const parsed = Number(amount);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return "";
  }

  return amount;
}
