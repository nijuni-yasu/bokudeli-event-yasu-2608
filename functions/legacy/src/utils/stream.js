import { PassThrough } from 'stream'

/**
 * Combines multiple writable streams into one.
 * Writes data to all provided writable streams simultaneously.
 * @param {WritableStream[]} streams - Array of writable streams to combine.
 * @returns {WritableStream} - A combined writable stream.
 */
export const combineStream = (...streams) => {
  const passThrough = new PassThrough()

  streams.forEach((stream) => {
    passThrough.pipe(stream).on('error', (err) => {
      console.error('Error in combined stream:', err)
      passThrough.unpipe(stream)
    })
  })

  return passThrough
}
