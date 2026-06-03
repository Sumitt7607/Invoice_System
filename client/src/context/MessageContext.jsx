import React, { createContext, useContext, useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const MessageContext = createContext(null);

export const useMsg = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMsg must be used within a MessageProvider');
  }
  return context;
};

// Store original alert
const originalAlert = window.alert;

export const MessageProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showMsg = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto remove after 4 seconds
    setTimeout(() => {
      removeMsg(id);
    }, 4000);
  };

  const removeMsg = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Override window.alert globally once the provider mounts
  useEffect(() => {
    window.alert = (message) => {
      if (!message) return;
      const msgStr = String(message);
      const msgLower = msgStr.toLowerCase();

      let type = 'info';
      if (
        msgLower.includes('success') ||
        msgLower.includes('complete') ||
        msgLower.includes('updated') ||
        msgLower.includes('recorded') ||
        msgLower.includes('saved') ||
        msgLower.includes('duplicated') ||
        msgLower.includes('added')
      ) {
        type = 'success';
      } else if (
        msgLower.includes('fail') ||
        msgLower.includes('error') ||
        msgLower.includes('required') ||
        msgLower.includes('invalid') ||
        msgLower.includes('unauthorized') ||
        msgLower.includes('denied')
      ) {
        type = 'error';
      } else if (msgLower.includes('warning') || msgLower.includes('caution')) {
        type = 'warning';
      }

      showMsg(msgStr, type);
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  const getToastStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-250',
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
        };
      case 'error':
        return {
          bg: 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-250',
          icon: <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />,
        };
      case 'warning':
        return {
          bg: 'bg-amber-50/95 dark:bg-amber-950/90 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-250',
          icon: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />,
        };
      default:
        return {
          bg: 'bg-indigo-50/95 dark:bg-slate-900/90 border-indigo-100 dark:border-slate-800 text-slate-800 dark:text-slate-200',
          icon: <Info className="h-5 w-5 text-brand-600 dark:text-brand-400 shrink-0" />,
        };
    }
  };

  return (
    <MessageContext.Provider value={{ showMsg }}>
      {children}

      {/* Toast Overlay Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 w-full max-w-sm pointer-events-none">
        {toasts.map((toast) => {
          const styles = getToastStyles(toast.type);
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all duration-300 animate-slide-in ${styles.bg}`}
              style={{
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
              }}
            >
              {styles.icon}
              <div className="flex-1 text-xs font-semibold leading-relaxed break-words pt-0.5">
                {toast.message}
              </div>
              <button
                onClick={() => removeMsg(toast.id)}
                className="rounded-lg p-0.5 opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-current shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </MessageContext.Provider>
  );
};
