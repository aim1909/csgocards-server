class CsgocardFunctions {
  static get appid() {
    return 730
  }

  static get contextid() {
    return 2
  }

  static addItems(items, Offer, type) {
    for (let item of JSON.parse(items)) {
      Offer[type === "their" ? "addTheirItem" : type === "my" ? "addMyItem" : null]({
        appid: CsgocardFunctions.appid,
        contextid: CsgocardFunctions.contextid,
        amount: 1,
        assetid: item
      })
    }
  }

  static addTheirItems(items, Offer) {
    CsgocardFunctions.addItems(items, Offer, "their")
  }

  static addMyItems(items, Offer) {
    CsgocardFunctions.addItems(items, Offer, "my")
  }
}

module.exports = CsgocardFunctions