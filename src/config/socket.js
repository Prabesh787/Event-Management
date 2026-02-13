/** Shared Socket.IO instance so controllers can emit without importing server.js (avoids circular deps). */
let io = null;

export function setIO(instance) {
  io = instance;
}

export function getIO() {
  return io;
}
