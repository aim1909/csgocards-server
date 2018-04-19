module.exports = {
  TRADE_ABORT_ESCROW(type = "trade") {
    return `Aborting ${type} because you are affected by trade holds. <a href="https://support.steampowered.com/kb_article.php?ref=8078-TPHC-6195" target="_blank" title="Steam: All about trade holds">More info.</a>`
  },
  TRADE_ABORT_ERROR_GET_DETAILS(type = "trade") {
    return `Aborting ${type}: Error getting user details.`
  },
  TRADE_ABORT_PROBATION(type = "trade") {
    return `Aborting ${type}, because you are affected by trade probation.`
  },
  SUBTRACT_CHIPS(amount, player) {
    return `We will subtract ${amount} chips from account ${player} after you accepted this offer. Thanks for using CSGOcards!`
  },
  ADD_CHIPS(amount, player) {
    return `We will add ${amount} chips to account ${player} after you accepted this offer. Thanks for using CSGOcards!`
  },
  TRADE_ERROR_SEND(type = "trade") {
    return `Aborting ${type}: Error while sending offer.`
  },
  TRADE_CONFIRMATION_PENDING(type = "trade") {
    return `Pending ${type}: Error confirming the trade. Please be patient...`
  },
  TRADE_OFFER_SENT(type = "Trade", id, tid) {
    return `<b>${type}</b> #${id}: Offer <b>#${tid}</b> sent to you, waiting for your answer.<br>`
  },
  OFFER_DECLINED(type = "trade", tid) {
    return `You declined ${type.toLowerCase()} #${tid}.`
  },
  OFFER_COUNTERED(type = "trade", tid) {
    return `Aborting ${type} #${tid}. Please do not send counter offers but make a new one instead.`
  },
  ERROR_GETTING_USER_DETAILS(type = "trade") {
    return `Aborting ${type}: Error getting user details.`
  }
}