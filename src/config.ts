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
    mediaInputField: string;
    attachmentsInput: string;

    sideBarNavElementSelector: string;
    sideBarSelector: string;
    addMediaBtnSelector: string;
    createPostBtnSelector: string;
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
    imageInputField: '[accept="image/jpg,image/jpeg,image/png,image/gif"]',
    attachmentsInput: '#add-attachments-button > input',
    mediaInputField: '[accept="video/*,audio/*,image/jpg,image/jpeg,image/png,image/gif"]',
    addMediaBtnSelector: '.ngMis',
    sideBarNavElementSelector: '[data-tag="navbar"] > nav > div',
    sideBarSelector: 'main-app-navigation',
    createPostBtnSelector: 'nav[aria-label="Creator navigation"]  button[aria-label="Create post"].sc-jrQzAO.lnIhxN',
  },
} as Config;
