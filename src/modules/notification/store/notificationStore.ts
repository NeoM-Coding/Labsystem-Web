import { create } from 'zustand'
import type { InboxMessage, RuleExecutionEvent } from '../types'

const MAX_MESSAGES = 100

interface NotificationState {
  messages: InboxMessage[]
  receive: (event: RuleExecutionEvent) => void
  markRead: (eventId: string) => void
  markAllRead: () => void
  clear: () => void
  hydratePreview: (events: RuleExecutionEvent[]) => void
  reset: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  messages: [],
  receive: (event) => set((state) => {
    if (state.messages.some((message) => message.event.eventId === event.eventId)) return state
    return {
      messages: [{ event, read: false }, ...state.messages].slice(0, MAX_MESSAGES),
    }
  }),
  markRead: (eventId) => set((state) => ({
    messages: state.messages.map((message) => message.event.eventId === eventId
      ? { ...message, read: true }
      : message),
  })),
  markAllRead: () => set((state) => ({
    messages: state.messages.map((message) => ({ ...message, read: true })),
  })),
  clear: () => set({ messages: [] }),
  hydratePreview: (events) => set({
    messages: events.slice(0, MAX_MESSAGES).map((event) => ({ event, read: false })),
  }),
  reset: () => set({ messages: [] }),
}))
