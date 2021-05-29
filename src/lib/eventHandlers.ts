import EventEmitter from 'events'

const eventHandler: EventEmitter = new EventEmitter()

/**
 * 프로세스 핸들러
 */
process.on('error', (error: any, message: string) => {
  if (error.code === 'EACCES') {
    console.error(`${process.env.PORT} requires elevated privileges`)
    process.exit(1)
  } else if (error.code === 'EADDRINUSE') {
    console.error(`${process.env.PORT} is already in use`)
    process.exit(1)
  } else {
    throw error
  }
})
