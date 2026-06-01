import React, { createContext, useContext, useState, ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface LoadingContextProps {
  showLoading: (message?: string) => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextProps | undefined>(undefined);

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("Aguarde...");

  const showLoading = (msg = "Aguarde...") => {
    setMessage(msg);
    setIsLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
  };

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading }}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4 transform transition-all scale-100 opacity-100">
            <div className="relative">
              <div className="absolute inset-0 border-4 border-violet-100 rounded-full"></div>
              <Loader2 className="w-12 h-12 text-violet-600 animate-spin relative z-10" />
            </div>
            <h3 className="mt-6 text-slate-900 font-display font-extrabold text-lg tracking-tight">Carregando</h3>
            <p className="text-slate-500 text-sm mt-2 text-center">{message}</p>
            
            {/* Progress Bar Animation */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-6 overflow-hidden relative">
              <div className="absolute inset-y-0 left-0 bg-violet-600 rounded-full w-1/2 animate-[progress_1.5s_ease-in-out_infinite]"></div>
            </div>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};
