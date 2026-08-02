"use client";

import React, { useState, useRef, useEffect } from "react";
import { FiChevronDown, FiSearch, FiCheck } from "react-icons/fi";

export type Country = {
  iso2: string;
  name: string;
  dialCode: string;
};

export const COUNTRIES: Country[] = [
  { iso2: "pk", name: "Pakistan", dialCode: "+92" },
  { iso2: "ae", name: "United Arab Emirates", dialCode: "+971" },
  { iso2: "sa", name: "Saudi Arabia", dialCode: "+966" },
  { iso2: "gb", name: "United Kingdom", dialCode: "+44" },
  { iso2: "us", name: "United States", dialCode: "+1" },
  { iso2: "ca", name: "Canada", dialCode: "+1" },
  { iso2: "qa", name: "Qatar", dialCode: "+974" },
  { iso2: "om", name: "Oman", dialCode: "+968" },
  { iso2: "kw", name: "Kuwait", dialCode: "+965" },
  { iso2: "bh", name: "Bahrain", dialCode: "+973" },
  { iso2: "au", name: "Australia", dialCode: "+61" },
  { iso2: "de", name: "Germany", dialCode: "+49" },
  { iso2: "fr", name: "France", dialCode: "+33" },
  { iso2: "it", name: "Italy", dialCode: "+39" },
  { iso2: "es", name: "Spain", dialCode: "+34" },
  { iso2: "tr", name: "Turkey", dialCode: "+90" },
  { iso2: "my", name: "Malaysia", dialCode: "+60" },
  { iso2: "sg", name: "Singapore", dialCode: "+65" },
  { iso2: "cn", name: "China", dialCode: "+86" },
  { iso2: "in", name: "India", dialCode: "+91" },
  { iso2: "bd", name: "Bangladesh", dialCode: "+880" },
  { iso2: "lk", name: "Sri Lanka", dialCode: "+94" },
  { iso2: "np", name: "Nepal", dialCode: "+977" },
  { iso2: "eg", name: "Egypt", dialCode: "+20" },
  { iso2: "za", name: "South Africa", dialCode: "+27" },
  { iso2: "jp", name: "Japan", dialCode: "+81" },
  { iso2: "kr", name: "South Korea", dialCode: "+82" },
];

interface CountryPhoneInputProps {
  value: string;
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
  onPhoneChange: (phone: string) => void;
  error?: string;
  placeholder?: string;
}

export default function CountryPhoneInput({
  value,
  countryCode,
  onCountryCodeChange,
  onPhoneChange,
  error,
  placeholder,
}: CountryPhoneInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCountry =
    COUNTRIES.find((c) => c.dialCode === countryCode) || COUNTRIES[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dialCode.includes(search) ||
      c.iso2.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-full">
      <div className="flex gap-2">
        {/* Flag & Dial Code Dropdown Button */}
        <div ref={dropdownRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`h-full flex items-center gap-2 px-3 py-3 rounded-lg border bg-gray-50 text-xs font-bold text-black hover:bg-white focus:outline-none transition-all cursor-pointer ${
              isOpen
                ? "border-[#B9853B] ring-1 ring-[#B9853B] bg-white"
                : "border-gray-200"
            }`}
          >
            <img
              src={`https://flagcdn.com/24x18/${selectedCountry.iso2}.png`}
              alt={selectedCountry.name}
              className="w-5 h-3.5 object-cover rounded-2xs shadow-2xs border border-gray-200"
            />
            <span className="font-bold text-gray-900">{selectedCountry.dialCode}</span>
            <FiChevronDown
              size={14}
              className={`text-gray-500 transition-transform duration-200 ${
                isOpen ? "rotate-180 text-[#B9853B]" : ""
              }`}
            />
          </button>

          {/* Searchable Dropdown Popup */}
          {isOpen && (
            <div className="absolute left-0 top-full mt-1 z-50 w-72 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Search Box */}
              <div className="p-2 border-b border-gray-100 bg-gray-50/60 sticky top-0">
                <div className="relative">
                  <FiSearch
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                    size={14}
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search country or code..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-900 focus:outline-none focus:border-[#B9853B]"
                    autoFocus
                  />
                </div>
              </div>

              {/* Country List */}
              <div className="max-h-60 overflow-y-auto divide-y divide-gray-50">
                {filteredCountries.length === 0 ? (
                  <p className="p-3 text-xs text-gray-400 text-center font-medium">
                    No matching country
                  </p>
                ) : (
                  filteredCountries.map((c) => {
                    const isSelected = c.dialCode === selectedCountry.dialCode;
                    return (
                      <button
                        key={c.iso2 + c.dialCode}
                        type="button"
                        onClick={() => {
                          onCountryCodeChange(c.dialCode);
                          setIsOpen(false);
                          setSearch("");
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-amber-50/80 font-bold text-[#B9853B]"
                            : "hover:bg-gray-50 font-medium text-gray-800"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <img
                            src={`https://flagcdn.com/24x18/${c.iso2}.png`}
                            alt={c.name}
                            className="w-5 h-3.5 object-cover rounded-2xs border border-gray-200 shrink-0"
                          />
                          <span className="truncate">{c.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-semibold text-gray-500">{c.dialCode}</span>
                          {isSelected && <FiCheck size={14} className="text-[#B9853B]" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Local Phone Number Input */}
        <div className="flex-1">
          <input
            type="tel"
            required
            value={value}
            onChange={(e) => onPhoneChange(e.target.value)}
            className={`w-full rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
              error
                ? "border-red-500 bg-red-50/20 text-red-900 focus:border-red-600 focus:ring-1 focus:ring-red-600"
                : "border-gray-200 bg-gray-50 text-black focus:border-[#B9853B] focus:bg-white focus:ring-1 focus:ring-[#B9853B] focus:outline-none"
            }`}
            placeholder={
              placeholder ||
              (selectedCountry.dialCode === "+92" ? "0300 1234567" : "123 456 789")
            }
          />
        </div>
      </div>

      {error ? (
        <p className="mt-1.5 text-xs text-red-600 font-semibold flex items-center gap-1">
          <span>•</span> {error}
        </p>
      ) : (
        <p className="mt-1 text-[11px] text-gray-400 font-medium">
          Selected: {selectedCountry.name} ({selectedCountry.dialCode})
        </p>
      )}
    </div>
  );
}
