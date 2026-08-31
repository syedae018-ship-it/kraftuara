"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  SUPPORTED_COUNTRIES,
  DEFAULT_COUNTRY,
  CountryDialCode,
  splitPhoneNumber,
  normalizePhoneNumber,
} from "@/lib/phone-utils";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PhoneInputProps {
  id?: string;
  name?: string;
  value?: string;
  onChange?: (normalizedValue: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  variant?: "dark" | "bloom" | "light";
  autoFocus?: boolean;
}

export function PhoneInput({
  id,
  name,
  value = "",
  onChange,
  label,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  className,
  inputClassName,
  variant = "dark",
  autoFocus = false,
}: PhoneInputProps) {
  // Parse initial or passed value
  const initialSplit = splitPhoneNumber(value);
  const [selectedCountry, setSelectedCountry] = useState<CountryDialCode>(() => {
    const found = SUPPORTED_COUNTRIES.find((c) => c.dialCode === initialSplit.countryCode);
    return found || DEFAULT_COUNTRY;
  });

  const [nationalNumber, setNationalNumber] = useState(initialSplit.nationalNumber);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Synchronize internal state when value prop changes externally
  useEffect(() => {
    const split = splitPhoneNumber(value);
    const found = SUPPORTED_COUNTRIES.find((c) => c.dialCode === split.countryCode);
    if (found && found.dialCode !== selectedCountry.dialCode) {
      setSelectedCountry(found);
    }
    if (split.nationalNumber !== nationalNumber) {
      setNationalNumber(split.nationalNumber);
    }
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const emitChange = (dialCode: string, national: string) => {
    const cleanNational = national.replace(/[^0-9]/g, "");
    if (!cleanNational) {
      onChange?.("");
      return;
    }
    const fullNormalized = normalizePhoneNumber(`${dialCode}${cleanNational}`, dialCode);
    onChange?.(fullNormalized);
  };

  const handleCountrySelect = (country: CountryDialCode) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    emitChange(country.dialCode, nationalNumber);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    // Handle full pasted number (e.g. "+91 98765 43210" or "+1 555-0123")
    if (raw.startsWith("+") || raw.startsWith("00")) {
      const split = splitPhoneNumber(raw);
      const matched = SUPPORTED_COUNTRIES.find((c) => c.dialCode === split.countryCode);
      if (matched) {
        setSelectedCountry(matched);
        setNationalNumber(split.nationalNumber);
        emitChange(matched.dialCode, split.nationalNumber);
        return;
      }
    }

    // Strip non-digits for national number
    const cleanDigits = raw.replace(/[^0-9]/g, "");
    setNationalNumber(cleanDigits);
    emitChange(selectedCountry.dialCode, cleanDigits);
  };

  // Format the national number for display (e.g. 98765 43210)
  const getFormattedNational = (digits: string) => {
    if (selectedCountry.code === "IN" && digits.length > 5) {
      return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`;
    }
    return digits;
  };

  // Variant-specific styling
  const isBloom = variant === "bloom";
  const isLight = variant === "light";

  const containerStyles = isBloom
    ? "bg-bloom-background border-bloom-border text-bloom-foreground focus-within:border-bloom-primary"
    : isLight
    ? "bg-white border-zinc-200 text-zinc-900 focus-within:border-zinc-900"
    : "bg-[#111111] border-white/10 text-white focus-within:border-maroon-600";

  const dropdownBg = isBloom
    ? "bg-bloom-card border-bloom-border text-bloom-foreground"
    : isLight
    ? "bg-white border-zinc-200 text-zinc-900"
    : "bg-[#161616] border-white/10 text-white";

  const dropdownHover = isBloom
    ? "hover:bg-bloom-secondary"
    : isLight
    ? "hover:bg-zinc-100"
    : "hover:bg-white/5";

  return (
    <div className={cn("space-y-1.5 w-full text-left font-body", className)}>
      {label && (
        <label
          htmlFor={id}
          className={cn(
            "block text-xs font-semibold font-heading",
            isBloom ? "text-bloom-muted" : "text-zinc-300"
          )}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <div
          className={cn(
            "flex items-center rounded-xl border transition-all duration-200 overflow-hidden text-xs shadow-sm",
            containerStyles,
            error && "border-red-500 focus-within:border-red-500",
            disabled && "opacity-50 cursor-not-allowed",
            inputClassName
          )}
        >
          {/* Country Code Trigger Dropdown */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={cn(
                "h-10 px-3 flex items-center gap-1.5 border-r transition-colors cursor-pointer select-none",
                isBloom ? "border-bloom-border hover:bg-bloom-secondary/50" : "border-white/10 hover:bg-white/5",
                disabled && "cursor-not-allowed hover:bg-transparent"
              )}
              title={`${selectedCountry.name} (${selectedCountry.dialCode})`}
            >
              <span className="text-base leading-none">{selectedCountry.flag}</span>
              <span className="font-mono font-semibold text-xs tracking-tight">{selectedCountry.dialCode}</span>
              <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
            </button>

            {/* Dropdown Options Panel */}
            {isDropdownOpen && (
              <div
                className={cn(
                  "absolute top-full left-0 mt-1.5 w-60 max-h-60 overflow-y-auto rounded-xl border shadow-2xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-100",
                  dropdownBg
                )}
              >
                <div className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 opacity-50 font-heading">
                  Select Country Code
                </div>
                {SUPPORTED_COUNTRIES.map((country) => {
                  const isSelected = country.dialCode === selectedCountry.dialCode;
                  return (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => handleCountrySelect(country)}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left",
                        dropdownHover,
                        isSelected && (isBloom ? "bg-bloom-accent text-bloom-primary font-bold" : "bg-maroon-950/60 text-white font-bold")
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-sm">{country.flag}</span>
                        <span className="truncate">{country.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[11px] opacity-80 shrink-0">
                        <span>{country.dialCode}</span>
                        {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* National Number Input */}
          <input
            id={id}
            name={name}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            disabled={disabled}
            autoFocus={autoFocus}
            required={required}
            value={getFormattedNational(nationalNumber)}
            onChange={handleInputChange}
            placeholder={placeholder || selectedCountry.placeholder}
            maxLength={15}
            className={cn(
              "w-full h-10 px-3 bg-transparent outline-none font-mono text-xs placeholder:text-zinc-500",
              disabled && "cursor-not-allowed"
            )}
          />
        </div>
      </div>

      {error ? (
        <p className="text-[11px] text-red-500 mt-1 font-body">{error}</p>
      ) : helperText ? (
        <p className={cn("text-[11px] mt-1 font-body", isBloom ? "text-bloom-muted" : "text-zinc-500")}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
