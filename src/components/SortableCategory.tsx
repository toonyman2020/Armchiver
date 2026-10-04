import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SidebarEditableButton } from './SidebarEditableButton'; // I need to know where SidebarEditableButton is defined
import { Trash2, Wand2, ChevronDown, ChevronRight } from 'lucide-react';

export function SortableCategory({ 
  id, 
  name, 
  count, 
  active, 
  onClick, 
  onDelete, 
  onChange, 
  parentId, 
  onSetParent, 
  allCategories,
  isExpandable,
  isExpanded = true,
  onToggleExpand,
  isEditing = false
}: { 
  id: string, 
  name: string, 
  count?: number,
  active: boolean, 
  onClick: () => void, 
  onDelete: () => void,
  onChange: (name: string) => void,
  parentId?: string,
  onSetParent?: (parentId: string | undefined) => void,
  allCategories?: { id: string, name: string, parentId?: string }[],
  isExpandable?: boolean,
  isExpanded?: boolean,
  onToggleExpand?: () => void,
  isEditing?: boolean
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
    <div ref={setNodeRef} style={style} {...attributes} {...(!isEditing ? listeners : {})} className={`flex items-center gap-1 ${!isEditing ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} w-full`}>
      {isExpandable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleExpand) onToggleExpand();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
          title={isExpanded ? "Collapse subcategories" : "Expand subcategories"}
        >
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
      )}
      {!isExpandable && parentId && (
        <div className="w-5 shrink-0" />
      )}
      <div className="flex-1 flex items-center min-w-0">
        <SidebarEditableButton 
          active={active} 
          onClick={onClick} 
          icon={<Wand2 className="w-4 h-4" />} 
          label={name}
          count={count}
          onChange={onChange}
        />
      </div>
      
      {isEditing && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }} 
          className="p-1 text-muted-foreground hover:text-destructive shrink-0 animate-in fade-in duration-150"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
