/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
import initReloadClient from '../initReloadClient';

export default function addHmrIntoScript(watchPath: string) {
  const reload = () => {
    // chrome.runtime.reload();
  };

  initReloadClient({
    watchPath,
    onUpdate: reload,
    onForceReload: reload,
  });
}
