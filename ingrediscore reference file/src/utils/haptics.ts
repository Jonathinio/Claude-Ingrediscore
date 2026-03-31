/**
 * Utility for triggering haptic feedback on mobile devices.
 * Uses the Vibration API which is supported by most mobile browsers.
 */
export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') => {
  if (!window.navigator.vibrate) return;

  switch (type) {
    case 'light':
      window.navigator.vibrate(10);
      break;
    case 'medium':
      window.navigator.vibrate(20);
      break;
    case 'heavy':
      window.navigator.vibrate(50);
      break;
    case 'success':
      window.navigator.vibrate([10, 30, 10]);
      break;
    case 'error':
      window.navigator.vibrate([50, 100, 50]);
      break;
  }
};
