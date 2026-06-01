export function formatPhone(value?: string | null) {
  const digits = (value ?? "").replace(/\D/g, "");

  if (!digits) return "";

  const normalizedDigits =
    digits.startsWith("7") || digits.startsWith("8")
      ? `7${digits.slice(1)}`
      : `7${digits}`;
  const nationalNumber = normalizedDigits.slice(1, 11);

  if (!nationalNumber) return "+7 (";

  return [
    `+7 (${nationalNumber.slice(0, 3)}`,
    nationalNumber.length >= 3 ? ")" : "",
    nationalNumber.slice(3, 6) ? ` ${nationalNumber.slice(3, 6)}` : "",
    nationalNumber.slice(6, 8) ? `-${nationalNumber.slice(6, 8)}` : "",
    nationalNumber.slice(8, 10) ? `-${nationalNumber.slice(8, 10)}` : "",
  ].join("");
}
