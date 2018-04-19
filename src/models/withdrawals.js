const {query} = require("../db")

module.exports = class WithdrawalsModel {
  static get table() {
    return "withdrawals"
  }

  static async create(type, tid) {
    return await query("INSERT INTO `" + WithdrawalsModel.table + "` (type, trade_offer_id) VALUES (?, ?)", [type, tid])
  }

  static async byTid(tid) {
    return await query("SELECT * FROM `" + WithdrawalsModel.table + "` WHERE `trade_offer_id` = ? LIMIT 1", [tid])
  }

  static async byId(id) {
    return await query("SELECT * FROM `" + WithdrawalsModel.table + "` WHERE `id` = ? LIMIT 1", [id])
  }

  static async setStatus(status, tid) {
    return await query("UPDATE `" + WithdrawalsModel.table + "` SET `status` = ? WHERE `trade_offer_id` = ?", [status, tid])
  }

  static async setTid(tid, id) {
    return await query("UPDATE `" + WithdrawalsModel.table + "` SET `trade_offer_id` = ?, `status` = \"Waiting for user\" WHERE `id` = ?", [tid, id])
  }
}