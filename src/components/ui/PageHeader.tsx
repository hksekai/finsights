import React from 'react';
import './PageHeader.css';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
}

export const PageHeader = ({ title, subtitle, children }: PageHeaderProps) => {
    return (
        <div className="page-header">
            <div>
                <h1 className="page-header-title">{title}</h1>
                {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
            </div>
            {children && <div className="page-header-actions">{children}</div>}
        </div>
    );
};
