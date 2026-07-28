import React from 'react';
import { ChevronDown, Plus, Save, X } from 'lucide-react';
import AdminModalFrame from './AdminModalFrame';

interface OperationCreateModalProps {
    categories: string[];
    name: string;
    category: string;
    keywords: string[];
    keywordInput: string;
    isAddingKeyword: boolean;
    onNameChange: (value: string) => void;
    onCategoryChange: (value: string) => void;
    onKeywordInputChange: (value: string) => void;
    onAddingKeywordChange: (value: boolean) => void;
    onAddKeyword: (keyword: string) => boolean;
    onRemoveKeyword: (index: number) => void;
    onClose: () => void;
    onSubmit: (event: React.FormEvent) => void;
}

export default function OperationCreateModal({
    categories,
    name,
    category,
    keywords,
    keywordInput,
    isAddingKeyword,
    onNameChange,
    onCategoryChange,
    onKeywordInputChange,
    onAddingKeywordChange,
    onAddKeyword,
    onRemoveKeyword,
    onClose,
    onSubmit,
}: OperationCreateModalProps) {
    const submitKeyword = () => {
        if (keywordInput.trim()) onAddKeyword(keywordInput);
        onAddingKeywordChange(false);
    };

    return (
        <AdminModalFrame title="Add Surgery Operation" maxWidth="max-w-xl" onClose={onClose}>
            <form onSubmit={onSubmit} className="mt-4 p-4 border border-dashed border-gray-200 dark:border-slate-700 rounded-xl space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Operation Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={event => onNameChange(event.target.value)}
                            placeholder="e.g. PPV, Phaco, GDI"
                            className="w-full bg-gray-50 dark:bg-slate-850 border border-gray-250 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#fcb7f0] focus:border-[#fcb7f0] transition-all dark:text-slate-200"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Category</label>
                        <div className="relative">
                            <select value={category} onChange={event => onCategoryChange(event.target.value)} className="w-full appearance-none bg-white dark:bg-[#151f32] border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none">
                                {categories.map(item => <option key={item} value={item}>{item}</option>)}
                            </select>
                            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Trigger Keywords</label>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {keywords.map((keyword, index) => (
                            <span key={keyword} className="inline-flex items-center gap-1 bg-[#fcb7f0]/35 dark:bg-[#fcb7f0]/15 text-[#8e5a7d] dark:text-[#fcb7f0] border border-[#fcb7f0]/35 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {keyword}
                                <button type="button" onClick={() => onRemoveKeyword(index)} className="hover:bg-[#fcb7f0]/50 rounded-full p-0.5">
                                    <X size={10} strokeWidth={3} />
                                </button>
                            </span>
                        ))}
                        {isAddingKeyword ? (
                            <input
                                type="text"
                                autoFocus
                                value={keywordInput}
                                onChange={event => onKeywordInputChange(event.target.value)}
                                onBlur={submitKeyword}
                                onKeyDown={event => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault();
                                        submitKeyword();
                                    } else if (event.key === 'Escape') {
                                        onAddingKeywordChange(false);
                                        onKeywordInputChange('');
                                    }
                                }}
                                placeholder="Keyword..."
                                className="bg-transparent border-b border-[#fcb7f0] px-1 py-0 text-[10px] font-bold outline-none text-[#8e5a7d] dark:text-[#fcb7f0] w-20"
                            />
                        ) : (
                            <button type="button" onClick={() => { onAddingKeywordChange(true); onKeywordInputChange(''); }} className="inline-flex items-center gap-0.5 bg-white hover:bg-[#fcb7f0]/10 dark:bg-slate-900 border border-dashed border-[#fcb7f0]/60 text-[#8e5a7d] dark:text-[#fcb7f0] text-[10px] font-bold px-2 py-0.5 rounded-full">
                                <Plus size={10} strokeWidth={3} /> Add
                            </button>
                        )}
                    </div>
                    <span className="text-[9px] text-gray-400 dark:text-slate-555 mt-1 block font-medium">Keywords are case-insensitive. Small keywords (≤2 characters) will match whole words only.</span>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-50 dark:border-slate-800">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-slate-350 text-xs font-bold rounded-lg">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg flex items-center gap-1">
                        <Save size={14} /> Save Operation
                    </button>
                </div>
            </form>
        </AdminModalFrame>
    );
}
