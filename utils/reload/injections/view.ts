/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
import initReloadClient from '../initReloadClient';

export default function addHmrIntoView(watchPath: string) {
  let pendingReload = false;

  initReloadClient({
    watchPath,
    onUpdate: () => {
      // disable reload when tab is hidden
      if (document.hidden) {
        pendingReload = true;
        return;
      }
      reload();
    },
  });

  // reload
  function reload(): void {
    pendingReload = false;
    // window.location.reload();
  }

  // reload when tab is visible
  function reloadWhenTabIsVisible(): void {
    !document.hidden && pendingReload && reload();
  }
  document.addEventListener('visibilitychange', reloadWhenTabIsVisible);
}
