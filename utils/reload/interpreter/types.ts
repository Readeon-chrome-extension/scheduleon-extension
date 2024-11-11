/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
type UpdatePendingMessage = {
  type: 'wait_update';
  path: string;
};
type UpdateRequestMessage = {
  type: 'do_update';
};
type UpdateCompleteMessage = { type: 'done_update' };
type BuildCompletionMessage = { type: 'build_complete' };
type ForceReloadMessage = { type: 'force_reload' };

export type SerializedMessage = string;
export type WebSocketMessage =
  | UpdateCompleteMessage
  | UpdateRequestMessage
  | UpdatePendingMessage
  | BuildCompletionMessage
  | ForceReloadMessage;
