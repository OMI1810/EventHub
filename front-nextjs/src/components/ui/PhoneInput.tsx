"use client";

import { IMaskInput } from "react-imask";

interface PhoneInputProps {
  className?: string;
  name?: string;
  placeholder?: string;
  value?: string;
  onBlur?: () => void;
  onChange: (value: string) => void;
}

export function PhoneInput({
  className,
  name,
  onBlur,
  onChange,
  placeholder,
  value,
}: PhoneInputProps) {
  return (
    <IMaskInput
      mask="+7 (000) 000-00-00"
      name={name}
      value={value ?? ""}
      unmask={false}
      overwrite
      lazy={false}
      inputMode="tel"
      autoComplete="tel"
      placeholder={placeholder}
      className={className}
      onBlur={onBlur}
      onAccept={(nextValue: unknown) => onChange(String(nextValue))}
    />
  );
}
