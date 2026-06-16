import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const RUSSIAN_PHONE_FORMATTED_LENGTH = 16;

export function normalizeRussianPhoneDigits(value: string) {
  let digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("8")) {
    digits = `7${digits.slice(1)}`;
  } else if (digits.startsWith("9")) {
    digits = `7${digits}`;
  } else if (!digits.startsWith("7") && digits.length <= 10) {
    digits = `7${digits}`;
  }

  if (digits.length === 10) {
    digits = `7${digits}`;
  }

  return digits.slice(0, 11);
}

export function formatRussianPhone(value: string) {
  const digits = normalizeRussianPhoneDigits(value);

  if (!digits) {
    return "";
  }

  const part1 = digits.slice(1, 4);
  const part2 = digits.slice(4, 7);
  const part3 = digits.slice(7, 9);
  const part4 = digits.slice(9, 11);

  let formatted = "+7";

  if (part1) {
    formatted += ` ${part1}`;
  }

  if (part2) {
    formatted += ` ${part2}`;
  }

  if (part3) {
    formatted += ` ${part3}`;
  }

  if (part4) {
    formatted += ` ${part4}`;
  }

  return formatted;
}

export function isValidRussianPhone(value: string) {
  return /^\+7 \d{3} \d{3} \d{2} \d{2}$/.test(value.trim());
}
