import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-20 left-4 right-4 md:bottom-10 md:right-10 md:left-auto md:w-96 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div key={toast.id} className={`flex items-start p-4 rounded-lg shadow-lg border text-white animate-slideUp ${
            toast.type === 'success' ? 'bg-agri-600 border-agri-700' : 
            toast.type === 'error' ? 'bg-red-600 border-red-700' : 'bg-gray-800 border-gray-900'
          }`}>
            <div className="flex-shrink-0 mt-0.5">
               {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
               {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
               {toast.type === 'info' && <Info className="w-5 h-5" />}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
            <button onClick={() => removeToast(toast.id)} className="ml-4 flex-shrink-0 text-white hover:text-gray-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};