'use client';

import React, { useState } from 'react';
import { 
  X, 
  FolderPlus, 
  Check, 
  BookmarkPlus, 
  Layers, 
  Sparkles,
  Plus
} from 'lucide-react';

interface SaveToListModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadsCount: number;
  leadName?: string;
  existingLists: string[];
  onConfirmSave: (listName: string) => void;
  theme?: 'dark' | 'light';
}

export const SaveToListModal: React.FC<SaveToListModalProps> = ({
  isOpen,
  onClose,
  leadsCount,
  leadName,
  existingLists,
  onConfirmSave,
  theme = 'dark',
}) => {
  const defaultList = existingLists.length > 0 ? existingLists[0] : 'General Leads';
  const [selectedList, setSelectedList] = useState(defaultList);
  const [newListName, setNewListName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  if (!isOpen) return null;

  // Deduplicate and ensure General Leads exists
  const allLists = Array.from(new Set(['General Leads', ...existingLists]));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreatingNew && newListName.trim()) {
      onConfirmSave(newListName.trim());
    } else {
      onConfirmSave(selectedList || 'General Leads');
    }
    onClose();
  };

  const isLight = theme === 'light';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className={`w-full max-w-md border-3 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_#000] relative animate-in zoom-in-95 duration-150 ${
          isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-xl bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:bg-slate-100 transition-transform active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
        >
          <X className="w-4 h-4 stroke-[3]" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-[#FFE600] border-2 border-black shadow-[3px_3px_0px_0px_#000] flex items-center justify-center shrink-0">
            <FolderPlus className="w-6 h-6 text-black stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
              <span>Save to CRM List</span>
            </h2>
            <p className={`text-xs font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {leadsCount === 1 && leadName
                ? `Organize "${leadName}" into a list`
                : `Organize ${leadsCount} prospect${leadsCount > 1 ? 's' : ''} into a list`}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* List Selection Options */}
          <div>
            <label className={`block text-xs font-black uppercase mb-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Select Destination List:
            </label>

            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
              {allLists.map((list) => {
                const isSelected = !isCreatingNew && selectedList === list;
                return (
                  <button
                    key={list}
                    type="button"
                    onClick={() => {
                      setSelectedList(list);
                      setIsCreatingNew(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black border-2 border-black cursor-pointer transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#FFE600] text-black shadow-[3px_3px_0px_0px_#000] scale-[1.02]'
                        : isLight 
                          ? 'bg-slate-100 text-slate-800 hover:bg-slate-200 shadow-[1.5px_1.5px_0px_0px_#000]'
                          : 'bg-slate-800 text-slate-300 hover:text-white shadow-[1.5px_1.5px_0px_0px_#000]'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    <span>{list}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setIsCreatingNew(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black border-2 border-black cursor-pointer transition-all flex items-center gap-1.5 ${
                  isCreatingNew
                    ? 'bg-[#38BDF8] text-black shadow-[3px_3px_0px_0px_#000]'
                    : isLight
                      ? 'bg-slate-200 text-slate-900 hover:bg-slate-300 shadow-[1.5px_1.5px_0px_0px_#000]'
                      : 'bg-slate-800 text-slate-200 hover:text-white shadow-[1.5px_1.5px_0px_0px_#000]'
                }`}
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>+ New List</span>
              </button>
            </div>
          </div>

          {/* New List Name Input (if creating new) */}
          {isCreatingNew && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-150">
              <label className={`block text-xs font-black uppercase mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                New List Name:
              </label>
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  required={isCreatingNew}
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="e.g. Dentists Miami, High Priority, Q4 Outreach..."
                  className="w-full bg-white border-2 border-black rounded-xl px-3 py-2 text-xs font-bold text-black placeholder-slate-400 shadow-[3px_3px_0px_0px_#000] focus:outline-none focus:shadow-[4px_4px_0px_0px_#38BDF8]"
                />
              </div>
            </div>
          )}

          {/* Submit & Cancel Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="neo-btn bg-white hover:bg-slate-100 text-black text-xs font-black px-4 py-2 shadow-[2.5px_2.5px_0px_0px_#000]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="neo-btn bg-[#00F59B] hover:bg-[#00E58F] text-black text-xs font-black px-5 py-2 shadow-[3px_3px_0px_0px_#000] flex items-center gap-1.5"
            >
              <BookmarkPlus className="w-4 h-4 stroke-[2.5]" />
              <span>Confirm & Save</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
