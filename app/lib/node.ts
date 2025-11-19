export function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
  const ab = new Uint8Array(buffer.length)
  for (let i = 0; i < buffer.length; i++) {
    ab[i] = buffer[i]
  }
  return ab.buffer
}
