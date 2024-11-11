/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
export interface Route {
  name: string;
  matchPattern: string;
  rootElement: string;
}

export interface RouteConfig {
  routes: Route[];
}
export default {
  routes: [
    {
      name: 'posts',
      matchPattern: '^https://www.patreon.com/([a-zA-Z0-9_.-]+)/posts(/?.*)$',
      rootElement: '#content',
    },
    {
      name: 'recentPosts',
      matchPattern: '^https://www.patreon.com/home$',
      rootElement: '#content',
    },
    {
      name: 'creatorPost',
      matchPattern: '^https://www.patreon.com/([a-zA-Z0-9_.-]+)(/?.*)$',
      rootElement: '#content',
    },
  ],
  themeKey: 'color_scheme_selection',
};
