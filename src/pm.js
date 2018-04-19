const cfg = require('./config');

const PM = new (require('pokermavens'))({
    url: cfg.PM.url,
    password: cfg.PM.pw
});

module.exports = PM;