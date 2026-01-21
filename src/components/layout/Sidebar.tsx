import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Table2, UploadCloud, CheckCircle2, Settings, TrendingUp, FileText } from 'lucide-react';
import './Sidebar.css';

const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
    <NavLink
        to={to}
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
    >
        <Icon size={20} />
        <span>{label}</span>
    </NavLink>
);

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    return (
        <>
            {/* Mobile Backdrop */}
            <div
                className={`sidebar-backdrop ${isOpen ? 'open' : ''}`}
                onClick={onClose}
            />

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-brand">
                        <div className="sidebar-logo">
                            <img src="/src/assets/logo.png" alt="Finsights Logo" />
                        </div>
                        <span className="sidebar-title">Finvoyant</span>
                    </div>

                    <nav className="sidebar-nav">
                        <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                        <NavItem to="/investments" icon={TrendingUp} label="Investments" />
                        <NavItem to="/tax-center" icon={FileText} label="Tax Center" />
                        <NavItem to="/signals" icon={Table2} label="Signals" />
                        <NavItem to="/upload" icon={UploadCloud} label="Upload Hub" />
                        <div className="sidebar-divider" />
                        <NavItem to="/verify" icon={CheckCircle2} label="Verification" />
                    </nav>
                </div>

                <div className="sidebar-footer">
                    <NavItem to="/settings" icon={Settings} label="Settings" />
                </div>
            </aside>
        </>
    );
};
