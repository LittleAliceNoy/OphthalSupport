import React from 'react';
import { Plus, X } from 'lucide-react';

interface AdminModalFrameProps {
  title: string;
  maxWidth: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function AdminModalFrame({ title, maxWidth, onClose, children }: AdminModalFrameProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
      <div className={`bg-white dark:bg-[#151f32] rounded-2xl shadow-xl border border-gray-150 dark:border-slate-800 p-5 sm:p-6 w-full ${maxWidth} animate-scaleUp overflow-y-auto max-h-[90vh]`}>
        <div className="flex justify-between items-center mb-4 border-b border-gray-50 dark:border-slate-800 pb-2">
          <h3 className="text-xs font-headline font-bold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
            <Plus size={16} className="text-[#8e5a7d] dark:text-brand-primary-dark" />
            {title}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors p-1">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
