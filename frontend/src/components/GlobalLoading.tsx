import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingContextType {
  isLoading: boolean;
  startLoading: (key?: string) => void;
  stopLoading: (key?: string) => void;
  isRequestPending: () => boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useGlobalLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useGlobalLoading must be used within GlobalLoadingProvider');
  }
  return context;
};

// Hook to track API requests
export const useRequestTracker = () => {
  const { startLoading, stopLoading } = useGlobalLoading();
  const requestCountRef = useRef(0);

  const trackRequest = useCallback(
    <T,>(promise: Promise<T>): Promise<T> => {
      const key = `request_${Date.now()}`;
      requestCountRef.current++;
      startLoading(key);

      return promise
        .finally(() => {
          requestCountRef.current--;
          stopLoading(key);
        });
    },
    [startLoading, stopLoading]
  );

  return { trackRequest };
};

interface GlobalLoadingProviderProps {
  children: ReactNode;
}

export const GlobalLoadingProvider: React.FC<GlobalLoadingProviderProps> = ({ children }) => {
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set());
  const isLoading = loadingKeys.size > 0;

  const startLoading = useCallback((key: string = 'global') => {
    setLoadingKeys((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  const stopLoading = useCallback((key: string = 'global') => {
    setLoadingKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const isRequestPending = useCallback(() => {
    return loadingKeys.size > 0;
  }, [loadingKeys]);

  return (
    <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading, isRequestPending }}>
      {children}
      {/* Global loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div className="relative flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
            <p className="text-xs text-slate-400 font-medium">加载中...</p>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
};
