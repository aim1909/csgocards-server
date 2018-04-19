const cfg = require("./config")

const steam = new (require("node-steam-wrapper"))({
  identitySecret: cfg.bots[0].identitySecret,
  sharedSecret: cfg.bots[0].sharedSecret,
  domain: cfg.domain,
  accountName: cfg.bots[0].accountName,
  password: cfg.bots[0].password
})

module.exports = steam