import fs from 'node:fs';
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

/**
 * After changing, please reload the extension at `chrome://extensions`
 * @type {chrome.runtime.ManifestV3}
 */
const manifest = {
  manifest_version: 3,
  default_locale: 'en',
  /**
   * if you want to support multiple languages, you can use the following reference
   * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Internationalization
   */
  name: '__MSG_extensionName__',
  version: packageJson.version,
  description: '__MSG_extensionDescription__',
  permissions: ['storage', 'tabs', 'cookies', 'scripting', 'webRequest'],
  host_permissions: ['https://www.patreon.com/*'],
  background: {
    service_worker: 'src/pages/background/index.js',
    type: 'module',
  },
  action: {
    default_popup: 'src/pages/popup/index.html',
    default_icon: 'scheduleon-logo.png',
  },

  icons: {
    128: 'scheduleon-logo.png',
  },
  content_security_policy: {
    extension_pages:
      "default-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'  https://www.readeon.com/ https://www.patreon.com/; object-src 'self';",
  },
  content_scripts: [
    {
      matches: ['https://www.patreon.com/*'],
      js: ['src/pages/contentInjector/index.js'],
      run_at: 'document_start',
    },
    {
      matches: ['https://www.patreon.com/*'],
      js: ['src/pages/contentWindowEventListener/index.js'],
      run_at: 'document_start',
    },

    {
      matches: ['https://www.patreon.com/*'],
      js: ['src/pages/contentUI/index.js'],
    },
    {
      matches: ['https://www.patreon.com/*'],
      // KEY for cache invalidation
      css: ['assets/css/contentStyle<KEY>.chunk.css'],
    },
  ],
  //devtools_page: 'src/pages/devtools/index.html',
  web_accessible_resources: [
    {
      resources: [
        'assets/js/*.js',
        'assets/css/*.css',
        'assets/fonts/*.ttf',
        'icon-128.png',
        'icon-34.png',
        'scroll-dark.png',
        'scroll-light.png',
        'src/pages/injectedScript/index.js',
      ],
      matches: ['*://*/*'],
    },
  ],
};

export default manifest;
