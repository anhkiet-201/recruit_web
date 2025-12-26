"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { LucideIcon, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DropdownOption {
  value: string;
  label: string;
  icon?: LucideIcon;
  color?: string; // Optional specific color class
}

interface DropdownProps {
  label?: string;
  icon?: LucideIcon;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  variant?: "default" | "small";
}

export default function Dropdown({
  label,
  icon: Icon,
  options,
  value,
  onChange,
  placeholder = "Select option",
  className = "",
  variant = "default",
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Update coordinates when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updatePosition = () => {
        const rect = buttonRef.current?.getBoundingClientRect();
        if (rect) {
          setCoords({
            top: rect.bottom,
            left: rect.left,
            width: rect.width,
          });
        }
      };

      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true); // true to capture all scroll events

      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside BOTH the trigger button and the portal menu (we can't use ref for portal easily here without more state,
      // but clicking outside generally means clicking on document).
      // A simpler way: The portal content stops propagation? No.
      // Best way with Portal: Check if target is inside containerRef (trigger) OR inside the dropdown menu (which is in body).

      // However, since the menu is in a Portal, containerRef.current.contains(event.target) will return false for the menu clicks.
      // So we need to handle this carefully.

      // WORKAROUND: We attach a specific ID or class to the portal wrapper and check for it.
      const target = event.target as HTMLElement;
      const isClickInMenu = target.closest(".dropdown-portal-menu");
      const isClickInTrigger =
        containerRef.current && containerRef.current.contains(target as Node);

      if (!isClickInMenu && !isClickInTrigger) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Styles based on variant
  const py = variant === "small" ? "py-1.5" : "py-3.5";
  const px = variant === "small" ? "px-3" : "px-5";
  const rounded = variant === "small" ? "rounded-xl" : "rounded-[1.2rem]";
  const fontSize = variant === "small" ? "text-xs" : "text-sm";
  const iconSize = variant === "small" ? 14 : 18;

  return (
    <div
      ref={containerRef}
      className={`w-full space-y-2 relative ${className}`}
    >
      {label && (
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-2">
          {label}
        </label>
      )}

      <div className="relative">
        {/* Trigger Button */}
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
                        flex items-center justify-between w-full bg-white text-gray-900 font-bold
                        ${rounded} border border-gray-200 shadow-sm
                        ${px} ${py} transition-all duration-300
                        hover:bg-gray-50 hover:border-gray-300
                        active:scale-[0.98]
                        focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                        ${
                          isOpen
                            ? "ring-2 ring-blue-500/20 border-blue-400"
                            : ""
                        }
                        ${fontSize}
                    `}
        >
          <div className="flex items-center gap-2.5 truncate mr-2">
            {Icon && (
              <Icon
                size={iconSize}
                className={isOpen ? "text-blue-600" : "text-gray-400"}
              />
            )}
            <span
              className={`truncate ${
                selectedOption ? "text-gray-900" : "text-gray-400 font-medium"
              }`}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
          <ChevronDown
            size={iconSize}
            className={`text-gray-400 transition-transform duration-300 ${
              isOpen ? "rotate-180 text-blue-600" : ""
            }`}
          />
        </button>

        {/* Dropdown Menu via Portal */}
        {mounted &&
          createPortal(
            <AnimatePresence>
              {isOpen && coords.width > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  style={{
                    top: coords.top + 8, // Add gap
                    left: coords.left,
                    width: coords.width,
                  }}
                  className="fixed z-1000 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden dropdown-portal-menu"
                >
                  <ul className="max-h-60 overflow-y-auto p-1.5 custom-scrollbar">
                    {options.map((option) => {
                      const isSelected = option.value === value;
                      const OptionIcon = option.icon;
                      return (
                        <li key={option.value}>
                          <button
                            type="button"
                            onClick={() => {
                              onChange(option.value);
                              setIsOpen(false);
                            }}
                            className={`
                                                        w-full text-left px-3 py-2.5 ${fontSize} font-bold rounded-xl
                                                        flex items-center justify-between transition-all group mb-0.5
                                                        ${
                                                          isSelected
                                                            ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                                                            : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                                                        }
                                                `}
                          >
                            <div className="flex items-center gap-2.5">
                              {OptionIcon && (
                                <OptionIcon
                                  size={iconSize}
                                  className={
                                    isSelected
                                      ? "text-white/80"
                                      : "text-gray-400 group-hover:text-blue-500"
                                  }
                                />
                              )}
                              <span>{option.label}</span>
                            </div>
                            {isSelected && (
                              <Check size={iconSize} className="text-white" />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body
          )}
      </div>
    </div>
  );
}
