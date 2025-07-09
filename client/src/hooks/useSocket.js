import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

export default function useSocket(onConnect) {
  const socketRef = useRef(null)

  useEffect(() => {
    const socket = io('http://localhost:3000')
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Connected to socket.io')
      if (onConnect) onConnect(socket)
    })

    return () => socket.disconnect()
  }, [])

  return socketRef
}
