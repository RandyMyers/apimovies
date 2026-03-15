let io = null;

function setIO(socketIO) {
  io = socketIO;
}

function getIO() {
  return io;
}

function emitToAdmin(event, data) {
  if (io) {
    io.to('admin').emit(event, data);
  }
}

module.exports = { setIO, getIO, emitToAdmin };
