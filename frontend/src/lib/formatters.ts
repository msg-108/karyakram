/**
 * Format ISO datetime string to localized Nepali / English date format
 * Example: Nov 15, 2026 at 2:30 PM
 */
export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return 'N/A';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return isoString;
  }
}

/**
 * Format ISO datetime to Date only
 * Example: Nov 15, 2026
 */
export function formatDate(isoString?: string | null): string {
  if (!isoString) return 'N/A';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return isoString;
  }
}

/**
 * Format ISO datetime to Time only
 * Example: 2:30 PM
 */
export function formatTime(isoString?: string | null): string {
  if (!isoString) return 'N/A';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return isoString;
  }
}

/**
 * Format monetary amount into Nepalese Rupees (NPR)
 * Example: NPR 1,500.00
 */
export function formatCurrency(amount: string | number | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return 'NPR 0.00';
  const numeric = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numeric)) return 'NPR 0.00';
  return `NPR ${numeric.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format relative time string (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(isoString?: string | null): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    if (Math.abs(diffDays) < 1) {
      const diffHours = Math.round(diffMs / (1000 * 60 * 60));
      return rtf.format(diffHours, 'hour');
    }
    return rtf.format(diffDays, 'day');
  } catch {
    return isoString;
  }
}
