<div align="center" style="padding-top: 25px">
<img src="https://c14.patreon.com/quxga_Patreon_Symbol_6fff9723d3.png" width="150px" alt="logo"/>
<h1>Scheduleon  Extension</h1>
</div>

## Table of Contents

- [Project structure](#intro)
- [Installation](#installation)
    - [Procedures](#procedures)
        - [Chrome](#chrome)
        - [Firefox](#firefox)

## Project structure <a name="intro"></a>

1. `src/config.ts` file describes routes to work with and selectors to get data and inject it into the page.
2. `src/pages/background/modules/*` files where we listen to Patreon API and fill the storage with data.
3. `src/content/ui/*` files where we inject UI elements into the page.
4. `src/shared/components/*` reusable components.
5. `src/shared/storages/*` dynamic storage which is shared between every page.

## Installation <a name="installation"></a>

## Procedures: <a name="procedures"></a>

1. Clone this repository.
2. Change `extensionDescription` and `extensionName` in messages.json
3. Install pnpm globally: `npm install -g pnpm` (check your node version >= 16.6, recommended >= 18)
4. Run `pnpm install`

## And next, depending on the needs:

### For Chrome: <a name="chrome"></a>

1. Run:
    - Dev: `pnpm dev` or `npm run dev`
    - Prod: `pnpm build` or `npm run build`
2. Open in browser - `chrome://extensions`
3. Check - `Developer mode`
4. Find and Click - `Load unpacked extension`
5. Select - `dist` folder

### For Firefox: <a name="firefox"></a>

1. Run:
    - Dev: `pnpm dev:firefox` or `npm run dev:firefox`
    - Prod: `pnpm build:firefox` or `npm run build:firefox`
2. Open in browser - `about:debugging#/runtime/this-firefox`
3. Find and Click - `Load Temporary Add-on...`
4. Select - `manifest.json` from `dist` folder

## License
This code is licensed for viewing purposes only. Any modification, redistribution, or commercial use is strictly prohibited. See the [LICENSE](https://github.com/Readeon-chrome-extension/readeon-chrome-extension/tree/main?tab=License-1-ov-file#) file for more details.

## Scheduleon Requested Permissions and Their Reasons

### Storage Justification
Used the storage permission to save Patreon authors' posts locally on your device. This allows me to display the content in a full-screen mode as part of the enhanced reading experience provided by the extension. The stored data is not shared and remains local to your browser.
### Tabs Justification
Used the tabs permission to detect when you are on a Patreon tab and enhance your experience accordingly. If you are not on Patreon, the extension can automatically open a new tab for you to navigate to Patreon. This ensures that you always have access to the features provided by our extension without manually switching tabs
### Scripting Justification
Used the scripting permission to inject custom scripts into Patreon pages. These scripts modify the content and layout of the page to provide an enhanced reading experience. For example, the scripts may restructure the page to display posts in a more reader-friendly format, add functionality like full-screen mode, or customize the appearance of posts based on your preferences.
### Cookies Jusitification
The cookies permission is used to maintain your session data on Patreon and Scheduleon, ensuring that you stay logged in and your preferences are remembered while using the extension. This helps in providing a seamless and consistent experience when interacting with the websites.
### Host Permissions Justification
Requested host permissions for the following domains to provide essential functionality for the Scheduleon extension:
https://www.patreon.com/*
This permission allows the extension to interact with Patreon, enhancing the user experience by modifying page layouts, injecting scripts, and enabling full-screen reading mode.
https://www.readeon.com/*
