import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Edit2, X } from 'lucide-react';

export function SortableCharacterFilter({ 
  id, 
  name, 
  count, 
  active, 
  onClick, 
  onRename,
  onClear,
  isEditing = false,
  selected = false,
  onToggleSelect
}: { 
  id: string, 
  name: string, 
  count: number,
  active: boolean, 
  onClick: () => void, 
  onRename: () => void,
  onClear: () => void,
  isEditing?: boolean,
  selected?: boolean,
  onToggleSelect?: () => void,
  key?: string
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...(!isEditing ? listeners : {})} 
      className={`flex items-center group ${!isEditing ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
      onClick={() => {
        if (isEditing && onToggleSelect) {
          onToggleSelect();
        }
      }}
    >
      {isEditing && (
        <input 
          type="checkbox" 
          checked={selected}
          onChange={() => {}}
          className="ml-3 mr-2 pointer-events-none shrink-0"
        />
      )}
      <div
        onClick={(e) => {
          if (isEditing) {
            e.preventDefault();
            return;
          }
          onClick();
        }}
        className={`flex-1 text-left ${isEditing ? (selected ? 'opacity-50 line-through' : '') : ''} ${isEditing ? 'pr-3 py-1.5' : 'px-3 py-2'} text-sm rounded-md transition-colors ${active && !isEditing ? 'bg-secondary text-foreground font-medium' : 'text-muted-foreground hover:bg-secondary/50'}`}
      >
        {name} ({count})
      </div>
      {isEditing && (
        <div className="flex pr-3 gap-1 shrink-0">
          <button 
            className="opacity-50 hover:opacity-100 p-1 text-primary transition-opacity"
            title="Rename character"
            onClick={(e) => { e.stopPropagation(); onRename(); }}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button 
            className="opacity-50 hover:opacity-100 p-1 text-destructive transition-opacity"
            title="Clear this name"
            onClick={(e) => { e.stopPropagation(); onClear(); }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
