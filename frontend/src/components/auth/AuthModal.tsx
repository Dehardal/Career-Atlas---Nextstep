import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { useRoadmapStore } from '../../store/useRoadmapStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const loginWithGoogle = useRoadmapStore((state) => state.loginWithGoogle);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const [isLoading, setIsLoading] = useState(false);

  const handleDemoLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      loginWithGoogle('student.demo@gmail.com', 'Alex Student', 'STUDENT');
      setIsLoading(false);
      onClose();
    }, 600); // Small delay for realistic feel
  };

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    
    // Check if Google Client ID is configured and GSI client is loaded
    if (googleClientId) {
      const google = (window as any).google;
      if (google?.accounts?.oauth2) {
        try {
          const client = google.accounts.oauth2.initTokenClient({
            client_id: googleClientId,
            scope: 'email profile openid',
            callback: async (tokenResponse: any) => {
              if (tokenResponse && tokenResponse.access_token) {
                try {
                  const res = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokenResponse.access_token}`);
                  const userInfo = await res.json();
                  if (userInfo && userInfo.email) {
                    const email = userInfo.email;
                    const name = userInfo.name || 'Google User';
                    const role = email === 'admin.demo@gmail.com' ? 'ADMIN' : 'STUDENT';
                    loginWithGoogle(email, name, role);
                    setIsLoading(false);
                    onClose();
                    return;
                  }
                } catch (e) {
                  console.error('Failed to fetch userinfo from Google:', e);
                }
              }
              // Fallback to demo login if Google authentication fails
              handleDemoLogin();
            },
          });
          client.requestAccessToken();
          return;
        } catch (err) {
          console.error('Failed to initialize Google OAuth2 client:', err);
        }
      }
    }

    // Default Fallback: Instant automatic login with demo account
    handleDemoLogin();
  };

  useEffect(() => {
    if (!isOpen || !googleClientId) return;

    // Load GSI client script if not already present
    if (!document.getElementById('google-gsi-client-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-client-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, [isOpen, googleClientId]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl z-10 p-6 flex flex-col items-center text-center"
          >
            {/* Design accents */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-brandCyan/10 rounded-full filter blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-brandIndigo/10 rounded-full filter blur-2xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              aria-label="Close Auth Modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Google circular G logo header */}
            <div className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center shadow-md mb-4 mt-2">
              <svg className="w-6 h-6" viewBox="0 0 24 24" width="24" height="24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.99 5.99 0 0 1 8 12.5a5.99 5.99 0 0 1 5.99-6.012c1.49 0 2.87.548 3.945 1.454l3.134-3.13C19.197 3.064 16.742 2 13.99 2 8.197 2 3.5 6.7 3.5 12.5S8.197 23 13.99 23c5.454 0 9.89-3.968 9.89-9.886 0-.61-.065-1.205-.182-1.777H12.24Z"
                />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Sign in with Google
            </h2>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-[280px] leading-relaxed">
              Unlock Career Atlas to design, explore, and customize interactive educational pathway roadmaps.
            </p>

            {/* Google Auth API & Custom Sign-In Button */}
            <div className="w-full mt-6 space-y-4">
              <motion.button
                id="google-signin-custom-btn"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-3 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-white font-bold text-xs transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 shrink-0 animate-spin text-brandCyan" />
                ) : (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" width="20" height="20">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.53-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-8.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.08 1.16-3.14 0-5.8-2.11-6.75-4.96H1.21v3.15C3.18 21.88 7.39 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.25 14.24A7.18 7.18 0 0 1 4.8 12c0-.79.13-1.57.38-2.31V6.54H1.21A11.96 11.96 0 0 0 0 12c0 1.92.45 3.74 1.21 5.39l4.04-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.22 0 12 0 7.39 0 3.18 2.12 1.21 5.39l4.04 3.15c.95-2.85 3.61-4.96 6.75-4.96z"
                    />
                  </svg>
                )}
                <span>{isLoading ? 'Connecting Google...' : 'Sign in with Google'}</span>
              </motion.button>

              {/* Fast Track Option (Only if googleClientId is defined, as a bypass option) */}
              {googleClientId && (
                <div className="pt-2">
                  <button
                    onClick={handleDemoLogin}
                    className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 transition-colors inline-flex items-center space-x-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-brandCyan" />
                    <span className="underline underline-offset-4">Bypass with Demo Account</span>
                  </button>
                </div>
              )}
            </div>
            
            <p className="text-[9px] text-slate-400 dark:text-slate-505 mt-6 leading-relaxed italic">
              Simulated fast-track login as student.demo@gmail.com
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
