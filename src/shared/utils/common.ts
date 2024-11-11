// Function to get event listeners of a given node
/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
export const getEventListeners = (node: EventTarget): Record<string, EventListener[]> => {
  const eventListeners: Record<string, EventListener[]> = {};
  const allEvents = [
    'abort',
    'afterprint',
    'animationend',
    'animationiteration',
    'animationstart',
    'beforeprint',
    'beforeunload',
    'blur',
    'canplay',
    'canplaythrough',
    'change',
    'click',
    'close',
    'contextmenu',
    'copy',
    'cuechange',
    'cut',
    'dblclick',
    'drag',
    'dragend',
    'dragenter',
    'dragexit',
    'dragleave',
    'dragover',
    'dragstart',
    'drop',
    'durationchange',
    'emptied',
    'ended',
    'error',
    'focus',
    'focusin',
    'focusout',
    'fullscreenchange',
    'fullscreenerror',
    'hashchange',
    'input',
    'invalid',
    'keydown',
    'keypress',
    'keyup',
    'load',
    'loadeddata',
    'loadedmetadata',
    'loadstart',
    'message',
    'mousedown',
    'mouseenter',
    'mouseleave',
    'mousemove',
    'mouseout',
    'mouseover',
    'mouseup',
    'offline',
    'online',
    'open',
    'pagehide',
    'pageshow',
    'paste',
    'pause',
    'play',
    'playing',
    'popstate',
    'progress',
    'ratechange',
    'reset',
    'resize',
    'scroll',
    'search',
    'seeked',
    'seeking',
    'select',
    'show',
    'stalled',
    'storage',
    'submit',
    'suspend',
    'timeupdate',
    'toggle',
    'touchcancel',
    'touchend',
    'touchmove',
    'touchstart',
    'transitionend',
    'unload',
    'volumechange',
    'waiting',
    'wheel',
  ];

  allEvents.forEach(eventType => {
    const listeners = getListeners(node, eventType);
    if (listeners.length > 0) {
      eventListeners[eventType] = listeners;
    }
  });

  return eventListeners;
};

// Helper function to get listeners of a specific event type
const getListeners = (node: EventTarget, eventType: string): EventListener[] => {
  const allListeners: EventListener[] = [];
  const eventListeners = (node as any).__events?.[eventType];

  if (eventListeners) {
    eventListeners.forEach((listener: { listener: EventListener }) => {
      allListeners.push(listener.listener);
    });
  }

  return allListeners;
};

// Clone node with listeners
export const cloneWithListeners = (originalNode: HTMLElement): HTMLElement => {
  // Clone the node
  const clonedNode = originalNode.cloneNode(true) as HTMLElement;

  // Clone event listeners
  const events = getEventListeners(originalNode);
  Object.keys(events).forEach(eventType => {
    events[eventType].forEach(listener => {
      clonedNode.addEventListener(eventType, listener);
    });
  });

  return clonedNode;
};
