const {query} = require("../db")

module.exports = class TradesModel {
  static get table() {
    return "trades"
  }

  static get types() {
    return ["Deposit", "Withdrawal"]
  }

  static async create(type, tid) {
    if (!TradesModel.types.includes(type)) throw new Error(`Type ${type} not allowed.`)
    await query("INSERT INTO `" + TradesModel.table + "` (type, trade_offer_id) VALUES (?, ?)", [type, tid])
  }

  static async byTid(tid) {
    return await query("SELECT * FROM `" + TradesModel.table + "` WHERE `trade_offer_id` = ? LIMIT 1", [tid])
  }
}
