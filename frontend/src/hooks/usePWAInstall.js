import { useState, useEffect } from 'react';

export const usePWAInstall = () => {
  // Check if the prompt was already captured before React mounted
  const [deferredPrompt, setDeferredPrompt] = useState(
    () => window._pwaPrompt || null
  );
  const [isInstallable, setIsInstallable] = useState(
    () => !!window._pwaPrompt
  );

  useEffect(() => {
    // If already captured, nothing to do
    if (window._pwaPrompt) {
      setDeferredPrompt(window._pwaPrompt);
      setIsInstallable(true);
    }

    // Listen for future fires (e.g. if hook mounts before the event)
    const onPromptReady = () => {
      if (window._pwaPrompt) {
        setDeferredPrompt(window._pwaPrompt);
        setIsInstallable(true);
      }
    };

    const onPrompt = (e) => {
      e.preventDefault();
      window._pwaPrompt = e;
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('pwa-prompt-ready', onPromptReady);
    window.addEventListener('beforeinstallprompt', onPrompt);

    return () => {
      window.removeEventListener('pwa-prompt-ready', onPromptReady);
      window.removeEventListener('beforeinstallprompt', onPrompt);
    };
  }, []);

  const installPWA = async () => {
    const prompt = deferredPrompt || window._pwaPrompt;
    if (!prompt) return;

    // Show the native install prompt
    prompt.prompt();

    const { outcome } = await prompt.userChoice;
    console.log('[PWA] Install outcome:', outcome);

    // Clean up — prompt can only be used once
    window._pwaPrompt = null;
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return { isInstallable, installPWA };
};
