"use client";

import geocodingService from "@/services/geocoding.service";
import {
  AddressSuggestion,
  GeocodedAddress,
} from "@/types/geocoding.types";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

interface AddressAutocompleteProps {
  label: string;
  value: string;
  required?: boolean;
  onManualChange: (address: string) => void;
  onSelect: (address: GeocodedAddress) => void;
}

export function AddressAutocomplete({
  label,
  value,
  required,
  onManualChange,
  onSelect,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLLabelElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: suggestions, isFetching } = useQuery({
    queryKey: ["geocoding-suggest", query],
    queryFn: () => geocodingService.suggest(query),
    enabled: query.trim().length >= 3,
    staleTime: 60_000,
  });

  const handleChange = (nextValue: string) => {
    setQuery(nextValue);
    setIsOpen(true);
    onManualChange(nextValue);
  };

  const handleSelect = async (suggestion: AddressSuggestion) => {
    setQuery(suggestion.text);
    setIsOpen(false);

    const response = await geocodingService.geocodeByMagicKey(
      suggestion.magicKey,
    );

    onSelect(response.data);
  };

  return (
    <label ref={wrapperRef} className="relative grid gap-2 text-sm text-zinc-300">
      {label}
      <input
        type="text"
        required={required}
        value={query}
        onFocus={() => setIsOpen(true)}
        onChange={(event) => handleChange(event.target.value)}
        placeholder="Начните вводить адрес"
        className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-primary"
      />
      {isFetching && (
        <span className="absolute right-3 top-9 text-xs text-zinc-500">
          ...
        </span>
      )}
      {isOpen && query.trim().length >= 3 && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-56 overflow-y-auto rounded-md border border-zinc-700 bg-zinc-950 p-2 shadow-xl">
          {suggestions?.data.length ? (
            <div className="grid gap-1">
              {suggestions.data.map((suggestion) => (
                <button
                  key={suggestion.magicKey}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    void handleSelect(suggestion);
                  }}
                  className="rounded-md px-3 py-2 text-left text-sm hover:bg-zinc-800"
                >
                  {suggestion.text}
                </button>
              ))}
            </div>
          ) : (
            <p className="px-3 py-2 text-sm text-zinc-500">
              Адреса не найдены
            </p>
          )}
        </div>
      )}
    </label>
  );
}
