import React, { createContext, useState, useCallback, useContext } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), duration);
    return id;
  }, [removeToast]);

  const showSuccess = useCallback((message) => addToast(message, 'success'), [addToast]);
  const showError = useCallback((message) => addToast(message, 'error', 6000), [addToast]);
  const showInfo = useCallback((message) => addToast(message, 'info'), [addToast]);

  const typeConfig = {
    success: {
      icon: <CheckCircle className="w-5 h-5 text-green-400" />,
      bg: 'bg-green-50 border-green-200',
      text: 'text-green-800',
    },
    error: {
      icon: <XCircle className="w-5 h-5 text-red-400" />,
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
    },
    info: {
      icon: <Info className="w-5 h-5 text-blue-400" />,
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
    },
  };

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showInfo }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => {
          const config = typeConfig[toast.type] || typeConfig.info;
          return (
            <div
              key={toast.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg pointer-events-auto max-w-sm ${config.bg}`}
            >
              {config.icon}
              <span className={`text-sm font-medium flex-1 ${config.text}`}>{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-600 ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
