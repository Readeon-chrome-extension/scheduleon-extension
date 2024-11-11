/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      __DEV__: string;
      __FIREFOX__: string;
    }
  }
}

export {};
