const {query} = require('../db');

class UsersModel {
    static get table() {
        return 'users';
    }

    static async byAuthToken(token) {
        return await query('SELECT * FROM `'+UsersModel.table+'` WHERE `auth_token` = ? LIMIT 1', [token]);
    }

    static async bySteamid(sid) {
        return await query('SELECT * FROM `'+UsersModel.table+'` WHERE `steamid` = ? LIMIT 1', [sid]);
    }

    static async byTid(tid) {
        return await query('SELECT * FROM `'+UsersModel.table+'` WHERE `trade_offer_id` = ? LIMIT 1', [tid]);
    }

    static async byId(id) {
        return await query('SELECT * FROM `'+UsersModel.table+'` WHERE `id` = ? LIMIT 1', [id]);
    }
}
module.exports = UsersModel;