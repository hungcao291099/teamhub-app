import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
export const formatCurrency = (number) => {
  if (typeof number !== 'number') {
    number = 0;
  }
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(number);
};

export const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("https") || url.startsWith("blob:")) return url;

  // Base URL likely http://localhost:3000
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

  // Ensure path starts with / if not present (unless it's just a filename, but usually it's /uploads/...)
  // But if url is 'uploads/foo.png', we need '/uploads/foo.png'
  const cleanPath = url.startsWith("/") ? url : `/${url}`;

  return `${baseUrl}${cleanPath}`;
};