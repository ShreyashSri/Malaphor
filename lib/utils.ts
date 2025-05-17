import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}

// Helper function to generate mock timestamps from recent days
export function generateTimestamp(daysAgo = 0, hoursAgo = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(date.getHours() - hoursAgo);
  return date.toISOString();
}

// Helper function to generate random version number
export function generateVersion(major = 1, minor = 0) {
  return `${major}.${minor}.${Math.floor(Math.random() * 10)}`;
}

// Helper function to generate commit hash
export function generateCommitHash() {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 40; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
