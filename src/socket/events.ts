/**
 * Socket.IO Event Constants
 * Centralised event names for the entire real-time layer.
 * Import these in both the server handlers and the frontend.
 */

export const SOCKET_EVENTS = {
    // ─── Connection ──────────────────────────────────────────────
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',

    // ─── Workspace Pod ───────────────────────────────────────────
    POD_JOIN: 'pod:join',           // client → server  : join a workspace pod room
    POD_LEAVE: 'pod:leave',         // client → server  : leave a workspace pod room
    POD_SEND_MESSAGE: 'pod:send_message',       // client → server  : send a message to a pod
    POD_NEW_MESSAGE: 'pod:new_message',         // server → clients : broadcast new pod message
    POD_HISTORY: 'pod:history',                 // server → client  : message history response
    POD_GET_HISTORY: 'pod:get_history',         // client → server  : request history
    POD_UNREAD_COUNT: 'pod:unread_count',       // server → client  : unread badge count
    POD_MARK_READ: 'pod:mark_read',             // client → server  : mark messages as read
    POD_TYPING: 'pod:typing',                   // client → server  : user is typing
    POD_TYPING_BROADCAST: 'pod:typing_broadcast', // server → room  : broadcast typing indicator
    POD_MEMBER_JOINED: 'pod:member_joined',     // server → room  : someone was added to pod
    POD_MEMBER_LEFT: 'pod:member_left',         // server → room  : someone left pod

    // ─── Direct Message ──────────────────────────────────────────
    DM_JOIN: 'dm:join',             // client → server  : join personal DM room
    DM_SEND_MESSAGE: 'dm:send_message',         // client → server  : send a DM
    DM_NEW_MESSAGE: 'dm:new_message',           // server → client  : incoming DM
    DM_HISTORY: 'dm:history',                   // server → client  : DM conversation history
    DM_GET_HISTORY: 'dm:get_history',           // client → server  : request DM history
    DM_UNREAD_COUNT: 'dm:unread_count',         // server → client  : unread DM badge
    DM_MARK_READ: 'dm:mark_read',               // client → server  : mark DM messages as read
    DM_TYPING: 'dm:typing',                     // client → server  : user is typing
    DM_TYPING_BROADCAST: 'dm:typing_broadcast', // server → client  : broadcast typing indicator
    DM_LIST: 'dm:list',                         // server → client  : list of DM conversations
    DM_GET_LIST: 'dm:get_list',                 // client → server  : request conversations list

    // ─── Errors ──────────────────────────────────────────────────
    ERROR: 'error',
} as const;

export type SocketEventKey = keyof typeof SOCKET_EVENTS;
export type SocketEventValue = typeof SOCKET_EVENTS[SocketEventKey];


// IMPORTANT
// Must Join First: To see messages sent by others in a Project Pod, you MUST send the pod:join event once per connection session. To receive DMs, you MUST send the dm:join event once.