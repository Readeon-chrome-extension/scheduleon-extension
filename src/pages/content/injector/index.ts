/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
const script = document.createElement('script');
script.src = chrome.runtime.getURL('src/pages/injectedScript/index.js');

(document.head || document.documentElement).appendChild(script);
