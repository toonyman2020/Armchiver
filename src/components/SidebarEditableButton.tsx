import React, { useState } from 'react';
import { Edit2 } from 'lucide-react';

export function SidebarEditableButton({ active, onClick, icon, label, count, onChange }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, count?: number, onChange: (v: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(label);

  return (
    <div className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group ${active ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-secondary text-muted-foreground hover:text-foreground'}`}>
      <div onClick={onClick} className="flex items-center gap-3 flex-1 text-left min-w-0 cursor-pointer">
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5 shrink-0' }) : icon}
        {isEditing ? (
          <input 
            autoFocus
            className="bg-transparent border-b border-current outline-none w-full cursor-text"
            value={val}
            onChange={e => setVal(e.target.value)}
            onBlur={() => { setIsEditing(false); onChange(val); }}
            onKeyDown={e => { if(e.key === 'Enter') { setIsEditing(false); onChange(val); } }}
          />
        ) : (
          <span className="truncate flex-1">
            {label} {count !== undefined && <span className="text-xs opacity-80">({count})</span>}
          </span>
        )}
      </div>
      {!isEditing && (
        <Edit2 
          className="w-4 h-4 opacity-0 group-hover:opacity-100 cursor-pointer shrink-0" 
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }} 
        />
      )}
    </div>
  );
}
