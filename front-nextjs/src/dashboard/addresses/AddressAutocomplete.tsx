"use client";
import arcgisService from "@/services/arcgis.service";
import { IAddressSuggestion, IGeoResult } from "@/types/arcgis.types";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

interface Props {
  onSelect: (address: string, geo: IGeoResult) => void;
  onManualInput: (address: string) => void;
  value: string;
}

export function AddressAutocomplete({ onSelect, onManualInput, value }: Props) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<IAddressSuggestion | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const currentMagicKeyRef = useRef<string | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["address-suggest", query],
    queryFn: () => arcgisService.getSuggestions(query),
    enabled: query.length >= 3,
    staleTime: 30000,
  });

  const { data: geoData, isFetching: isFetchingGeo } = useQuery({
    queryKey: ["address-geo", selectedSuggestion?.magicKey],
    queryFn: () => arcgisService.findByMagicKey(selectedSuggestion!.magicKey),
    enabled: !!selectedSuggestion,
    staleTime: 60000,
  });

  useEffect(() => {
    if (geoData?.data && selectedSuggestion) {
      if (selectedSuggestion.magicKey === currentMagicKeyRef.current) {
        onSelect(geoData.data.displayName, geoData.data);
        setIsOpen(false);
      }
    }
  }, [geoData, selectedSuggestion]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedSuggestion(null);
    currentMagicKeyRef.current = null;
    setIsOpen(true);
  };

  const handleSelect = (suggestion: IAddressSuggestion) => {
    setQuery(suggestion.text);
    setSelectedSuggestion(suggestion);
    currentMagicKeyRef.current = suggestion.magicKey;
  };

  const handleInputFocus = () => {
    if (query.length >= 3) setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      e.preventDefault();
      onManualInput(query.trim());
      setIsOpen(false);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (query.trim() && !selectedSuggestion) {
        onManualInput(query.trim());
      }
    }, 200);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder="Начните вводить адрес..."
        className="w-full px-3 py-2 border rounded-md pr-10"
      />
      {(isLoading || isFetchingGeo) && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {isOpen && suggestions?.data && suggestions.data.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.data.map((s) => (
            <li
              key={s.magicKey}
              onClick={() => handleSelect(s)}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
            >
              {s.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
