import { useEffect, useState } from 'react';
import { ErrorMonitor } from '../lib/error-monitor';

export const DebugToolbar = () => {
  const [debugMode, setDebugMode] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('debugMode');
    const isDebug = saved === 'true';
    setDebugMode(isDebug);

    // Show toolbar in development or when debug mode is enabled
    setShowToolbar(process.env.NODE_ENV === 'development' || isDebug);
  }, []);

  const toggleDebug = () => {
    const newMode = !debugMode;
    setDebugMode(newMode);
    localStorage.setItem('debugMode', String(newMode));

    if (newMode) {
      console.log('🔧 Debug mode enabled');
      ErrorMonitor.captureError(new Error('Debug mode enabled'), {
        component: 'DebugToolbar',
        action: 'toggleDebug',
      });
    }

    window.location.reload();
  };

  const clearErrorLogs = () => {
    localStorage.removeItem('errorLogs');
    console.log('🧹 Error logs cleared');
  };

  const exportLogs = () => {
    const logs = localStorage.getItem('errorLogs');
    const blob = new Blob([logs || ''], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!showToolbar) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black/80 text-white p-4 rounded-lg shadow-lg">
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="debugMode"
            checked={debugMode}
            onChange={toggleDebug}
            className="w-4 h-4"
          />
          <label htmlFor="debugMode" className="text-sm">
            Debug Mode
          </label>
        </div>

        <div className="space-y-1">
          <button
            onClick={clearErrorLogs}
            className="block w-full text-left text-xs px-2 py-1 hover:bg-white/10 rounded"
          >
            Clear Logs
          </button>
          <button
            onClick={exportLogs}
            className="block w-full text-left text-xs px-2 py-1 hover:bg-white/10 rounded"
          >
            Export Logs
          </button>
        </div>
      </div>
    </div>
  );
};
