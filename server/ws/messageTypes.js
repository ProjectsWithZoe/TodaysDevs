/**
 * WebSocket message type constants.
 * All WS messages sent through chatManager.broadcast() use one of these types.
 */
export const MESSAGE_TYPES = {
  // Section 5 — team chat / task updates
  CHAT_MESSAGE:      'chat_message',
  TASK_CREATED:      'task_created',
  TASK_UPDATED:      'task_updated',
  TASK_DELETED:      'task_deleted',
  MEMBER_JOINED:     'member_joined',
  MEMBER_LEFT:       'member_left',

  // Section 6 — submission lifecycle
  PROJECT_SUBMITTED: 'project_submitted'
}
