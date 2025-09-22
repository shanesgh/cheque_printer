import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown } from "lucide-react";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = "Select date...",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update internal state when prop changes
  useEffect(() => {
    setSelectedDate(value);
  }, [value]);

  const formatDateForDisplay = (dateStr: string) => {
    if (!dateStr) return placeholder;
    try {
      // Parse the date string and ensure it stays in local timezone
      let date: Date;

      if (dateStr.includes("T") || dateStr.includes("Z")) {
        // ISO format - convert to local date only
        date = new Date(dateStr);
      } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // YYYY-MM-DD format - treat as local date to avoid timezone issues
        const [year, month, day] = dateStr.split("-").map(Number);
        date = new Date(year, month - 1, day); // month is 0-indexed
      } else {
        // Other formats
        date = new Date(dateStr);
      }

      if (isNaN(date.getTime())) return dateStr;

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateForInput = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      // Parse the date string and ensure it stays in local timezone
      let date: Date;

      if (dateStr.includes("T") || dateStr.includes("Z")) {
        // ISO format - convert to local date only
        date = new Date(dateStr);
      } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // YYYY-MM-DD format - treat as local date
        const [year, month, day] = dateStr.split("-").map(Number);
        date = new Date(year, month - 1, day); // month is 0-indexed
      } else {
        // Other formats
        date = new Date(dateStr);
      }

      if (isNaN(date.getTime())) return "";

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch {
      return "";
    }
  };

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    onChange(newDate);
    setIsOpen(false);
  };

  const handleInputClick = () => {
    setIsOpen(!isOpen);
    // Focus the hidden input to trigger native date picker on mobile
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.click();
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Display Button */}
      <button
        type="button"
        onClick={handleInputClick}
        className="w-full px-3 py-2 text-left bg-white border border-gray-200 rounded-md 
                   hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
                   transition-colors duration-200 flex items-center justify-between group"
      >
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
          <span
            className={`text-sm ${selectedDate ? "text-gray-900" : "text-gray-500"}`}
          >
            {formatDateForDisplay(selectedDate)}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 
                     ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Hidden Native Date Input for Mobile/Desktop Compatibility */}
      <input
        ref={inputRef}
        type="date"
        value={formatDateForInput(selectedDate)}
        onChange={(e) => handleDateChange(e.target.value)}
        className="absolute opacity-0 pointer-events-none"
        tabIndex={-1}
      />

      {/* Custom Dropdown Calendar (for better desktop experience) */}
      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 
                        rounded-md shadow-lg z-50 p-3"
        >
          <input
            type="date"
            value={formatDateForInput(selectedDate)}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-200 rounded 
                       focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />

          {/* Quick Date Options */}
          <div className="mt-2 space-y-1">
            <button
              type="button"
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                handleDateChange(tomorrow.toISOString().split("T")[0]);
              }}
              className="w-full px-2 py-1 text-xs text-left hover:bg-gray-100 rounded"
            >
              Tomorrow
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
