'use client';

import React, { useState, useEffect } from 'react';
import { X, DollarSign, ArrowRightLeft, TrendingUp, Info, Check, RefreshCw } from 'lucide-react';

const DEFAULT_RATES = {
  USD: 34.20,
  GBP: 44.62,
  EUR: 38.34,
  AUD: 23.66,
  CAD: 25.10,
  JPY: 0.235,
  SGD: 26.20,
  CHF: 39.80,
};

const CURRENCY_LIST = [
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸', symbol: '$' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧', symbol: '£' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺', symbol: '€' },
  { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦', symbol: 'C$' },
  { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵', symbol: '¥' },
  { code: 'SGD', name: 'Singapore Dollar', flag: '🇸🇬', symbol: 'S$' },
  { code: 'CHF', name: 'Swiss Franc', flag: '🇨🇭', symbol: 'Fr' },
];

const PRESETS = [20, 50, 100, 200, 500, 1000];

export default function CurrencyConverterModal({ isOpen, onClose, rates: externalRates }) {
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [amount, setAmount] = useState('100');
  const [direction, setDirection] = useState('toTHB'); // 'toTHB' | 'fromTHB'

  if (!isOpen) return null;

  const rawRate = (externalRates && externalRates[selectedCurrency]) || DEFAULT_RATES[selectedCurrency] || 34.20;
  const currentRate = typeof rawRate === 'number' ? rawRate : (parseFloat(rawRate) || 34.20);
  const numAmount = parseFloat(amount) || 0;

  const calculatedResult = direction === 'toTHB'
    ? (numAmount * currentRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : (currentRate > 0 ? (numAmount / currentRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00');

  const currObj = CURRENCY_LIST.find((c) => c.code === selectedCurrency) || CURRENCY_LIST[0];

  const handleToggleDirection = () => {
    setDirection((prev) => (prev === 'toTHB' ? 'fromTHB' : 'toTHB'));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="currency-converter-title"
      className="fixed inset-0 z-[2500] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-surface border border-borderDark rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-14 border-b border-borderDark px-5 flex items-center justify-between bg-surfaceLight/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 id="currency-converter-title" className="text-sm font-bold text-white tracking-wide">
                Thai Baht (THB) Currency Converter
              </h2>
              <p className="text-[10px] font-mono text-slate-400">
                Pattaya Street Mid-Market Exchange Calculator
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surfaceLight transition-colors"
            title="Close Converter"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Currency Selection Chips */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              Select Currency
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {CURRENCY_LIST.map((c) => {
                const isSel = c.code === selectedCurrency;
                return (
                  <button
                    key={c.code}
                    onClick={() => setSelectedCurrency(c.code)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all ${
                      isSel
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                        : 'bg-surfaceLight/40 border-borderDark/60 text-slate-300 hover:text-white hover:bg-surfaceLight'
                    }`}
                  >
                    <span>{c.flag}</span>
                    <span>{c.code}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calculator Interactive Stage */}
          <div className="p-4 rounded-2xl bg-canvas border border-borderDark shadow-inner space-y-3">
            {/* Input Row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <span className="text-[10px] font-mono text-slate-400 block mb-1">
                  {direction === 'toTHB' ? `Amount in ${currObj.name} (${currObj.code})` : 'Amount in Thai Baht (THB ฿)'}
                </span>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400 font-mono font-bold text-sm">
                    {direction === 'toTHB' ? currObj.symbol : '฿'}
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-surfaceLight border border-borderDark rounded-xl pl-9 pr-3 py-2 text-white font-mono font-bold text-base focus:outline-none focus:border-amber-400 transition-colors"
                    placeholder="Enter amount..."
                  />
                </div>
              </div>

              {/* Swap Button */}
              <button
                onClick={handleToggleDirection}
                className="mt-5 p-2.5 rounded-xl bg-surfaceLight hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-borderDark transition-transform active:rotate-180"
                title="Swap conversion direction"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Presets Row */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono text-slate-500 mr-1">Quick:</span>
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setAmount(p.toString())}
                  className="px-2 py-0.5 rounded-md bg-surfaceLight/60 hover:bg-amber-500/20 hover:text-amber-300 border border-borderDark/40 text-[10px] font-mono text-slate-300 transition-colors"
                >
                  {direction === 'toTHB' ? `${currObj.symbol}${p}` : `${p}฿`}
                </button>
              ))}
            </div>

            {/* Calculated Output Display */}
            <div className="pt-2 border-t border-borderDark/60 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">
                {direction === 'toTHB' ? 'Total in Thai Baht:' : `Total in ${currObj.code}:`}
              </span>
              <div className="text-right">
                <div className="text-2xl font-mono font-black text-amber-300 drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]">
                  {direction === 'toTHB' ? `${calculatedResult} ฿` : `${currObj.symbol}${calculatedResult}`}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  Rate: 1 {currObj.code} = {currentRate.toFixed(2)} THB
                </div>
              </div>
            </div>
          </div>

          {/* Pattaya Expat Exchange Advice */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Pattaya Street Tip: Where to Exchange</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              In Pattaya, look for the bright yellow <strong>T.T. Currency Exchange</strong> booths along Beach Road, Second Road, and Soi Buakhao. They offer the closest rates to mid-market with zero commissions. Avoid airport arrival desks and hotel counters, which charge steep markups.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="h-12 border-t border-borderDark px-5 flex items-center justify-between bg-surfaceLight/20 shrink-0 text-[10px] font-mono text-slate-400">
          <span>Rates updated dynamically</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-surfaceLight hover:bg-slate-700 text-white font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
