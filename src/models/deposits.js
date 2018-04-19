const {query} = require('../db');

module.exports = class DepositsModel {
    static get table() {
        return 'deposits';
    }

    static async create(type, tid) {
        return await query('INSERT INTO `'+DepositsModel.table+'` (type, trade_offer_id) VALUES (?, ?)', [type, tid]);
    }

    static async byTid(tid){
        return await query('SELECT * FROM `'+DepositsModel.table+'` WHERE `trade_offer_id` = ? LIMIT 1', [tid]);
    }

    static async byId(id) {
        return await query('SELECT * FROM `'+DepositsModel.table+'` WHERE `id` = ? LIMIT 1', [id]);
    }

    static async setStatus(status, tid) {
        return await query('UPDATE `'+DepositsModel.table+'` SET `status` = ? WHERE `trade_offer_id` = ?', [status, tid]);
    }

    static async setTid(tid, id) {
        return await query('UPDATE `'+DepositsModel.table+'` SET `trade_offer_id` = ?, `status` = "Waiting for user" WHERE `id` = ?', [tid, id]);
    }
};