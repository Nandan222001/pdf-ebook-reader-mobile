// src/lib/utils.ts
// Utility functions for the mobile app

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

/**
 * Format date to relative time
 */
export function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) return date.toLocaleDateString();
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

/**
 * Generate a gradient color pair from a string (for book covers)
 */
export function generateCoverGradient(title: string): { from: string; to: string } {
  const gradients = [
    { from: '#7c3aed', to: '#3b82f6' },
    { from: '#f59e0b', to: '#ef4444' },
    { from: '#10b981', to: '#14b8a6' },
    { from: '#f43f5e', to: '#ec4899' },
    { from: '#6366f1', to: '#a855f7' },
    { from: '#06b6d4', to: '#3b82f6' },
    { from: '#f97316', to: '#f59e0b' },
    { from: '#8b5cf6', to: '#d946ef' },
  ];
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

/**
 * Get initials from a title for placeholder covers
 */
export function getInitials(title: string): string {
  const words = title.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Get theme colors based on theme name
 */
export function getThemeColors(theme: 'dark' | 'light' | 'sepia') {
  const themes = {
    dark: {
      bg: '#1a1a2e',
      surface: '#26263e',
      accent: '#a855f7',
      text: '#e5e5eb',
      muted: '#9494a8',
      border: '#373750',
    },
    light: {
      bg: '#f7f7f5',
      surface: '#ffffff',
      accent: '#8b5cf6',
      text: '#1e1e23',
      muted: '#787882',
      border: '#dcdcd7',
    },
    sepia: {
      bg: '#f4e9d2',
      surface: '#fcf3df',
      accent: '#b45309',
      text: '#4a3423',
      muted: '#8b7355',
      border: '#d2bea0',
    },
  };
  return themes[theme];
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Export annotations as markdown string
 */
export function exportAnnotationsMarkdown(
  bookTitle: string,
  bookAuthor: string | null,
  highlights: any[],
  bookmarks: any[],
  annotations: any[]
): string {
  let md = `# Annotations for ${bookTitle}\n\n`;
  md += `**Author:** ${bookAuthor || 'Unknown'}\n`;
  md += `**Exported:** ${new Date().toLocaleString()}\n\n`;

  if (highlights.length > 0) {
    md += `## Highlights\n\n`;
    highlights.forEach((h) => {
      md += `### Page ${h.page_number}\n> ${h.text}\n`;
      if (h.note) md += `**Note:** ${h.note}\n`;
      md += `*Color: ${h.color}*\n\n`;
    });
  }

  if (bookmarks.length > 0) {
    md += `## Bookmarks\n\n`;
    bookmarks.forEach((b) => {
      md += `- **Page ${b.page_number}:** ${b.title}${b.note ? ` — ${b.note}` : ''}\n`;
    });
    md += `\n`;
  }

  if (annotations.length > 0) {
    md += `## Notes\n\n`;
    annotations.forEach((a) => {
      md += `### Page ${a.page_number} (${a.type})\n${a.content}\n\n`;
    });
  }

  return md;
}
