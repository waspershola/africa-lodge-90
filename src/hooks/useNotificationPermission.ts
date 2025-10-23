import { useState, useEffect } from 'react';

export function useNotificationPermission() {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [showPrompt, setShowPrompt] = useState<boolean>(false);

  useEffect(() => {
    // Check if permission was previously granted
    const permission = localStorage.getItem('notification_permission_granted');
    if (permission === 'true') {
      setHasPermission(true);
    } else if (permission === null) {
      // First time - show prompt
      setShowPrompt(true);
    }
  }, []);

  const requestPermission = () => {
    localStorage.setItem('notification_permission_granted', 'true');
    setHasPermission(true);
    setShowPrompt(false);
  };

  const denyPermission = () => {
    localStorage.setItem('notification_permission_granted', 'false');
    setHasPermission(false);
    setShowPrompt(false);
  };

  return {
    hasPermission,
    showPrompt,
    requestPermission,
    denyPermission,
  };
}
