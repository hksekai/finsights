import { useState, type ReactNode } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import './PanelWrapper.css';

interface PanelWrapperProps {
    title: string;
    children: ReactNode;
    onEdit?: () => void;
    onDelete?: () => void;
    className?: string;
    isSystemPanel?: boolean; // System panels can't be deleted, only hidden
}

export function PanelWrapper({
    title,
    children,
    onEdit,
    onDelete,
    className = '',
    isSystemPanel = false
}: PanelWrapperProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleEdit = () => {
        setIsMenuOpen(false);
        onEdit?.();
    };

    const handleDelete = () => {
        setIsMenuOpen(false);
        onDelete?.();
    };

    return (
        <div className={`panel-wrapper ${className}`}>
            <div className="panel-wrapper-header">
                <h3 className="panel-wrapper-title">{title}</h3>
                {(onEdit || onDelete) && (
                    <div className="panel-menu-container">
                        <button
                            className="panel-menu-trigger"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            <MoreHorizontal size={18} />
                        </button>
                        {isMenuOpen && (
                            <>
                                <div className="panel-menu-backdrop" onClick={() => setIsMenuOpen(false)} />
                                <div className="panel-menu-dropdown">
                                    {onEdit && (
                                        <button className="panel-menu-item" onClick={handleEdit}>
                                            <Pencil size={14} />
                                            <span>Edit</span>
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button className="panel-menu-item danger" onClick={handleDelete}>
                                            <Trash2 size={14} />
                                            <span>{isSystemPanel ? 'Hide' : 'Remove'}</span>
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
            <div className="panel-wrapper-content">
                {children}
            </div>
        </div>
    );
}
