'use client'

import { useEffect, useRef } from 'react'
import { socket } from '@/lib/socket'

export interface CrmEvent {
  entity: 'customer' | 'lead' | 'task' | 'employee' | string
  action: 'create' | 'update' | 'delete' | string
  data?: any
  id?: string
}

export function useRealtime(onEvent: (event: CrmEvent) => void, entities?: string[]) {
  const callbackRef = useRef(onEvent)
  const entitiesRef = useRef(entities)

  // Keep refs up to date without re-registering the socket listener
  useEffect(() => {
    callbackRef.current = onEvent
    entitiesRef.current = entities
  })

  useEffect(() => {
    if (!socket.connected) {
      socket.connect()
    }

    const handleCrmEvent = (event: CrmEvent) => {
      if (!entitiesRef.current || entitiesRef.current.includes(event.entity)) {
        callbackRef.current(event)
      }
    }

    socket.on('crm_event', handleCrmEvent)

    return () => {
      socket.off('crm_event', handleCrmEvent)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Register once, use ref to stay fresh
}
