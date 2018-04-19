const cfg = require("./config")
const io = require("socket.io")(cfg.port)
module.exports = io