/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
import { clearTimeout } from 'timers';

export function debounce<A extends unknown[]>(callback: (...args: A) => void, delay: number) {
  let timer: NodeJS.Timeout;
  return function (...args: A) {
    clearTimeout(timer);
    timer = setTimeout(() => callback(...args), delay);
  };
}
