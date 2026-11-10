import React, { useState, useEffect } from 'react';
import { ToastProvider, useToast } from './components/Toast';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import GettingStarted from './pages/GettingStarted';
import Prospects from './pages/Prospects';
import DraftsReview from './pages/DraftsReview';
import SendQueue from './pages/SendQueue';
import Replies from './pages/Replies';
import ABTests from './pages/ABTests';
import SuppressionAudit from './pages/SuppressionAudit';
import Settings from './pages/Settings';
import PublicUnsubscribe from './pages/PublicUnsubscribe';
import { api } from './api';

function MainApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedSector, setSelectedSector] = useState('');
  const [settings, setSettings] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const { addToast } = useToast();

  // Check if current route is public unsubscribe (/unsubscribe/:token)
  const pathname = window.location.pathname;
  const isUnsubscribeRoute = pathname.startsWith('/unsubscribe/');
  const unsubToken = isUnsubscribeRoute ? pathname.split('/unsubscribe/')[1] : null;

  const loadSettings = async () => {
    try {
      const s = await api.getSettings();
      setSettings(s);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleSeedDemo = async () => {
    try {
      addToast('Seeding fresh demo data...', 'info');
      await api.seedDemo();
      addToast('Demo database successfully populated!', 'success');
      window.location.reload();
    } catch (err) {
      addToast(`Seed error: ${err.message}`, 'error');
    }
  };

  if (isUnsubscribeRoute) {
    return <PublicUnsubscribe token={unsubToken} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          settings={settings}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onSeedDemo={handleSeedDemo}
        />

        <main className="flex-1 pb-16">
          {activeTab === 'dashboard' && (
            <Dashboard
              setActiveTab={setActiveTab}
              onSelectSector={(sector) => {
                setSelectedSector(sector);
                setActiveTab('prospects');
              }}
            />
          )}
          {activeTab === 'getting-started' && (
            <GettingStarted setActiveTab={setActiveTab} onSeedDemo={handleSeedDemo} />
          )}
          {activeTab === 'prospects' && (
            <Prospects
              setActiveTab={setActiveTab}
              initialSector={selectedSector}
              onClearInitialSector={() => setSelectedSector('')}
            />
          )}
          {activeTab === 'drafts' && <DraftsReview setActiveTab={setActiveTab} />}
          {activeTab === 'send-queue' && <SendQueue />}
          {activeTab === 'replies' && <Replies />}
          {activeTab === 'ab-tests' && <ABTests />}
          {activeTab === 'suppression-audit' && <SuppressionAudit />}
          {activeTab === 'settings' && <Settings onSettingsUpdated={(s) => setSettings(s)} />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
