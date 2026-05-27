"use client";

import { useEffect, useState } from "react";

interface IGeoResult {
  displayName: string;
  longitude: number | null;
  latitude: number | null;
}

interface Props {
  onSelect: (address: string, geo: IGeoResult) => void;
  onManualInput: (address: string) => void;
  value: string;
}

export function AddressAutocomplete({ onSelect, onManualInput, value }: Props) {
  const [query, setQuery] = useState(value);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const submitManualAddress = () => {
    const address = query.trim();

    if (!address) return;

    onManualInput(address);
    onSelect(address, {
      displayName: address,
      longitude: null,
      latitude: null,
    });
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    submitManualAddress();
  };

  return (
    <input
      type="text"
      value={query}
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      onBlur={submitManualAddress}
      placeholder="Введите адрес..."
      className="w-full rounded-md border px-3 py-2"
    />
  );
}
