"use client";

import { useState } from "react";
import { downloadExcel, downloadCSV } from "@/lib/export";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";

interface ExportButtonProps {
  data: Record<string, string>[];
  filename: string;
  disabled?: boolean;
}

export default function ExportButton({ data, filename, disabled = false }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleExportExcel = () => {
    setIsOpen(false);
    downloadExcel(data, `${filename}.xls`);
  };

  const handleExportCSV = () => {
    setIsOpen(false);
    downloadCSV(data, `${filename}.csv`);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        disabled={disabled || data.length === 0}
        onClick={() => setIsOpen(!isOpen)}
        className="dropdown-toggle inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-success-600 px-4 text-sm font-medium text-white transition hover:bg-success-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="8" y1="13" x2="16" y2="13"/>
          <line x1="8" y1="17" x2="16" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
        Exporter Excel / CSV
      </button>

      <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)} className="w-48">
        <DropdownItem
          onItemClick={handleExportExcel}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <svg className="w-4 h-4 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          Exporter en Excel
        </DropdownItem>
        <DropdownItem
          onItemClick={handleExportCSV}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <svg className="w-4 h-4 text-success-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          Exporter en CSV
        </DropdownItem>
      </Dropdown>
    </div>
  );
}
