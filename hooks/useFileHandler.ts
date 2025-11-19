
import { useState, useRef, ChangeEvent } from 'react';
import { FileData } from '../types';

export const useFileHandler = () => {
    const [selectedFiles, setSelectedFiles] = useState<FileData[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles: FileData[] = [];
            for (let i = 0; i < e.target.files.length; i++) {
                const file = e.target.files[i];
                const isText = 
                    file.type.startsWith('text/') || 
                    file.name.endsWith('.md') || 
                    file.name.endsWith('.json') || 
                    file.name.endsWith('.csv') || 
                    file.name.endsWith('.ts') || 
                    file.name.endsWith('.tsx') || 
                    file.name.endsWith('.js') || 
                    file.name.endsWith('.py');
                
                try {
                    const data = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        if (isText) {
                            reader.readAsText(file);
                        } else {
                            reader.readAsDataURL(file);
                        }
                    });
                    
                    newFiles.push({
                        name: file.name,
                        type: file.type,
                        data: data,
                        isText: isText
                    });
                } catch (error) {
                    console.error("File read error:", error);
                }
            }
            setSelectedFiles(prev => [...prev, ...newFiles]);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemoveFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    return { selectedFiles, setSelectedFiles, fileInputRef, handleFileSelect, handleRemoveFile };
};
