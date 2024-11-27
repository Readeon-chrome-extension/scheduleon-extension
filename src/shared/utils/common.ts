// Function to get event listeners of a given node

import axios from 'axios';

/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
export const feedbackScheduleonError = `Patreon post and patch endpoints are not being intercepted when scheduling posts`;
export const feedbackSuccess = `Scheduleon successfully scheduled posts`;
export const schedulingOptionsFeedbacks = `Having trouble getting tier details for scheduling options pop-up`;
const detectBrowser = () => {
  const userAgent = navigator?.userAgent;

  if (userAgent.includes('Firefox')) {
    return 'firefox';
  } else if (userAgent.includes('Chrome')) {
    return 'chrome';
  } else {
    return 'unknown';
  }
};
export const submitFeedback = async (feedback: string) => {
  const response = await axios.post(`https://www.readeon.com/api/feedbacks/create`, {
    feedback: feedback,
    browser: detectBrowser(),
    extension: 'Scheduleon',
  });
  return response;
};
