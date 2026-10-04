import React, { useState, useEffect } from 'react';
import { addItem, getItems, Item } from '../lib/database';
import { Upload, Search, FileText, Image as ImageIcon } from 'lucide-react';

export const DatabaseDashboard: React.FC = () => {
    const [items, setItems] = useState<Item[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'document'>('all');

    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        const fetchedItems = await getItems();
        setItems(fetchedItems);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        
        const newItem = {
            name: file.name,
            description: 'Uploaded from CharArchive',
            type: (file.type.startsWith('image/') ? 'image' : 'document') as 'image' | 'document',
            originalPath: file.name // Note: File objects in browser don't expose full path for security
        };
        
        await addItem(newItem, file);
        loadItems();
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'all' || item.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const handleExport = () => {
        const report = items.map(item => `Name: ${item.name}\nType: ${item.type}\nDescription: ${item.description}\n---\n`).join('\n');
        const blob = new Blob([report], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'archive_report.md';
        a.click();
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Archive Database</h1>
                <div className="flex gap-2">
                    <button onClick={handleExport} className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded">
                        <FileText size={20} />
                        Export Markdown
                    </button>
                    <label className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded cursor-pointer">
                        <Upload size={20} />
                        Upload File
                        <input type="file" className="hidden" onChange={handleUpload} />
                    </label>
                </div>
            </div>
            
            <p className="text-xs text-muted-foreground">Note: Browser security prevents accessing the original local file path.</p>
            
            <div className="flex gap-4">
                <input 
                    type="text" 
                    placeholder="Search files..." 
                    className="border p-2 rounded flex-1"
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select className="border p-2 rounded" onChange={(e) => setTypeFilter(e.target.value as any)}>
                    <option value="all">All Types</option>
                    <option value="image">Images</option>
                    <option value="document">Documents</option>
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredItems.map(item => (
                    <div key={item.id} className="border p-4 rounded shadow-sm hover:shadow-md transition-shadow">
                        {item.type === 'image' ? <ImageIcon className="w-12 h-12 mb-2" /> : <FileText className="w-12 h-12 mb-2" />}
                        <h3 className="font-bold">{item.name}</h3>
                        <p className="text-sm text-gray-500">{item.type}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
