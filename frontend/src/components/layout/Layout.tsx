import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Camera, Bell, Settings, LogOut, Shield, BarChart3, Video, Menu, X, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { icon: LayoutDashboard, label: t('dashboard'), path: '/dashboard' },
    { icon: Camera, label: t('events'), path: '/events' },
    { icon: Shield, label: t('detections'), path: '/detections' },
    { icon: Bell, label: t('alerts'), path: '/alerts' },
    { icon: Video, label: t('devices'), path: '/devices' },
    { icon: BarChart3, label: t('analytics'), path: '/analytics' },
    { icon: Settings, label: t('settings'), path: '/settings' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success(t('loggedOut'));
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card/95 backdrop-blur-xl border-b border-border z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-lg">{t('sentinel')}</h1>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "w-64 border-r border-border bg-card backdrop-blur-xl",
        "lg:block fixed lg:static inset-y-0 left-0 z-40 transition-transform duration-300",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 flex items-center gap-3 mt-16 lg:mt-0">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-xl tracking-tight">{t('sentinel')}</h1>
        </div>

        <nav className="px-4 py-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  isActive 
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-sm" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-border">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">{t('signOut')}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto lg:ml-0">
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-xl items-center justify-between px-4 sm:px-8 sticky top-0 z-10 hidden lg:flex">
          <h2 className="font-semibold text-lg">
            {navItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
          </h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'fr' : 'en')}
              className="flex items-center gap-2 px-3 py-1.5 bg-accent border border-border rounded-lg hover:bg-accent/80 transition-colors"
            >
              <Languages className="w-4 h-4" />
              <span className="text-xs font-medium">{i18n.language === 'en' ? 'FR' : 'EN'}</span>
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-green-500">{t('systemOnline')}</span>
            </div>
            <div className="w-8 h-8 bg-slate-800 rounded-full border border-slate-700" />
          </div>
        </header>
        <div className="p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
