/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
export interface Config {
  pages: {
    overlyMountRootSelector: string;
    continueWithAuthoreonBtnInjectSelector: string;
    headerRootSelector: string;
    nextButtonSelector: string;
    // these selector for normal
    postAccessRoot: string;
    // new UI Selectors
    postAccessRootNew: string;
    continueWithAuthoreon: string;
    backButton: string;
    overlayViewBtnContainer: string;
    imageInputField: string;
    attachmentsInput: string;
    addMoreImages: string;
    sideBarNavElementSelector: string;
    sideBarSelector: string;
  };
}
export default {
  pages: {
    overlyMountRootSelector: '#renderPageContentWrapper',
    headerRootSelector: '[data-tag="post-editor-header-title"]',
    continueWithAuthoreonBtnInjectSelector: 'nav > div:nth-child(1) > div > div:nth-child(2) > button',
    // these selector for normal view
    postAccessRoot: '.gyvyyS > div',
    //new UI
    postAccessRootNew: 'div.dyEUUG  > div[data-cardlayout-edgeless="true"]',
    continueWithAuthoreon: '#continue-with-authoreon-btn',
    backButton: 'button.flNEmp',
    overlayViewBtnContainer: '#open-overlay-view-btn-container',
    imageInputField: '[accept="image/x-png,image/gif,image/jpeg,image/png"]',
    attachmentsInput: '#add-attachments-button > input',
    addMoreImages: '[aria-label="Add more images"]',
    sideBarNavElementSelector: '[data-tag="navbar"] > nav > div',
    sideBarSelector: 'main-app-navigation',
  },
} as Config;
