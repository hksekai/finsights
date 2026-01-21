import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import './Layout.css';

export const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();

    // Close sidebar when route changes
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

    return (
        <div className="app-layout">
            <button
                className="mobile-menu-btn"
                onClick={() => setIsSidebarOpen(true)}
            >
                <Menu size={24} />
            </button>

            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <main className="app-main">
                <Outlet />
            </main>
        </div>
    );
};
