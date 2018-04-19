const TradeOfferManager = require("steam-tradeoffer-manager")
const fn = require("./functions")
const util = require("./utility")
const steam = require("./steamClient")
const PM = require("./pm")
const io = require("./io")
const models = require("./models")
const TXT = require("./txt")

const bank = io.of("/bank")

const users = {
  bank: {}
}

const emitBalance = (steamid, balance, afterTrade = false) => {
  bank.to(steamid).emit("balance", {
    balance,
    afterTrade
  })
}

const hasEscrow = them => (them.escrowDays > 0)

const hasProbation = them => (Boolean(them.probation))

const onErrorSendTrade = (type, err, status, offer, user) => {
  let data = {
    error: err,
    status: status,
    offer: offer,
    user: user
  }
  data[type] = type
  console.error(`Error sending ${type}!`, data)
  bank.to(user.steamid).emit("err", TXT.TRADE_ERROR_SEND(type))
}

const onErrorGetUserDetails = (type, err, user) => {
  console.error("onErrorGetUserDetails", err)
  bank.to(user.steamid).emit("err", TXT.ERROR_GETTING_USER_DETAILS(type))
}

const afterSentOffer = async (type, offer, id, user) => {
  if (!["Deposit", "Withdrawal"].includes(type)) {
    console.warn(`Unknown offer type ${type}.`)
    return
  }
  if (type === "Deposit") await models.deposits.setTid(offer.id, id)
  else await models.withdrawals.setTid(offer.id, id)
  await models.trades.create(type, offer.id)
  bank.to(user.steamid).emit("offer_sent", {
    type,
    msg: TXT.TRADE_OFFER_SENT(type, id, offer.id)
  })
}

const pmGetBalance = async player => {
  const api = await PM.AccountsGet({
    Player: player
  })
  if (!api) throw new Error(`PM API seems down!`)
  if (String(api.Result) !== "Ok") throw new Error(`PM API did not return with OK status! Wrong player?`)
  if (!Number(api.Balance)) throw new Error(`PM API failed to return balance hence having OK status!`)
  return api.Balance
}

bank.on("connection", async socket => {
  const cookie = socket.handshake.headers.cookie
  if (cookie === undefined) {
    console.warn("Returning because the cookie header is not set.")
    return
  }
  const authToken = util.getCookieValue(cookie, "auth_token")
  if (cookie === undefined) {
    console.warn("Returning because the cookie header is not set.")
    return
  }

  const user = await models.users.byAuthToken(authToken)
  if (!user) {
    console.error(`Could not get user by auth token ${authToken}!`)
    return
  }
  users.bank[authToken] = user
  socket.join(user.steamid)

  socket.on("update_my_poker", async () => {
    const api = await PM.AccountsGet({
      Player: user.player
    })

    if (api && api.Result === "Ok") {
      bank.to(user.steamid).emit("update_my_poker", {
        avatar: api.Avatar,
        chat: api.Chat,
        chatColor1: api.ChatColor1,
        chatColor2: api.ChatColor2,
        balance: api.Balance,
        equalRake: api.ERake,
        propRake: api.PRake,
        tourneyFees: api.TFees,
        inPlayCash: api.RingChips,
        inPlayTourney: api.RegChips,
        logins: api.Logins,
        tickets: api.Tickets,
        permissions: api.Permissions,
        level: api.Level,
        title: api.Title,
        player: api.Player,
        realName: api.RealName,
        location: api.Location,
        lastReset: api.LastReset,
        firstLogin: api.FirstLogin,
        lastLogin: api.LastLogin
      })
    }
  })

  socket.on("balance", async () => emitBalance(user.steamid, await pmGetBalance(user.player)))

  socket.on("deposit", async id => {
    const type = "deposit"
    console.log(`Deposit #${id} incoming for ${user.steamid}...`)
    const deposit = await models.deposits.byId(Number(id))
    if (String(deposit.steamid) !== String(user.steamid)) {
      bank.to(user.steamid).emit("err", TXT.TRADE_ABORT_ERROR_GET_DETAILS(type))
      return
    }
    if (deposit && deposit.trade_link) {
      const offer = steam.manager.createOffer(deposit.trade_link)
      offer.getUserDetails((err, me, them) => {
        if (err) {
          onErrorGetUserDetails(type, err, user)
          return
        }
        if (process.env.NODE_ENV !== "devel") {
          if (hasEscrow(them)) {
            bank.to(user.steamid).emit("err", TXT.TRADE_ABORT_ESCROW(type))
            return
          }
        }
        if (hasProbation(them)) {
          bank.to(user.steamid).emit("err", TXT.TRADE_ABORT_PROBATION(type))
          return
        }
        fn.addTheirItems(deposit.items, offer)
        offer.setMessage(TXT.ADD_CHIPS(deposit.items_value, user.player))
        offer.send(async (err, status) => {
          if (err) onErrorSendTrade(type, err, status, offer, user)
          else if (status === "sent") await afterSentOffer("Deposit", offer, id, user)
          else {
            console.log(`Unexpected status for sent deposit #${offer.id}`, status)
            bank.to(user.steamid).emit("err", TXT.TRADE_ERROR_SEND(type))
          }
        })
      })
    }
  })

  socket.on("withdrawal", async id => {
    const type = "withdrawal"
    console.log(`Withdrawal #${id} incoming for ${user.steamid}...`)
    const withdrawal = await models.withdrawals.byId(Number(id))
    if (String(withdrawal.steamid) !== String(user.steamid)) {
      bank.to(user.steamid).emit("err", TXT.TRADE_ABORT_ERROR_GET_DETAILS(type))
      return
    }
    const offer = steam.manager.createOffer(withdrawal.trade_link)
    offer.getUserDetails((err, me, them) => {
      if (err) {
        onErrorGetUserDetails("withdrawal", err, user)
        return
      }
      if (hasEscrow(them)) {
        bank.to(user.steamid).emit("err", TXT.TRADE_ABORT_ESCROW(type))
        return
      }
      if (hasProbation(them)) {
        bank.to(user.steamid).emit("err", TXT.TRADE_ABORT_PROBATION(type))
        return
      }
      fn.addMyItems(withdrawal.items, offer)
      offer.setMessage(TXT.SUBTRACT_CHIPS(withdrawal.items_value, user.player))
      offer.send((err, status) => {
        if (err) onErrorSendTrade(type, err, status, offer, user)
        else if (status === "pending") {
          console.log(`Offer #${offer.id} sent, but requires confirmation`)
          steam.community.acceptConfirmationForObject(steam.identitySecret, offer.id, async err => {
            if (err) {
              console.error(err)
              bank.to(user.steamid).emit("err", TXT.TRADE_CONFIRMATION_PENDING(type))
            }
            else {
              console.log(`Withdrawal for #${offer.id} confirmed!`)
              await afterSentOffer("Withdrawal", offer, id, user)
            }
          })
        }
        else console.log(`Unexpected status for sent withdrawal #${offer.id}`, status)
      })
    })
  })

  socket.on("disconnect", () => socket.leave(user.steamid))
})

steam.manager.on("sentOfferChanged", async offer => {
  const offerState = TradeOfferManager.ETradeOfferState[offer.state]
  console.log(`TID #${offer.id} changed state to ${offerState}(${offer.state})`)

  const getTradeAndType = async () => {
    const trade = await models.trades.byTid(offer.id)
    if (!trade) {
      console.log(`TID #${offer.id} not found in DB.`)
      return
    }
    const type = trade.type
    if (!["Deposit", "Withdrawal"].includes(type)) {
      console.log(`Aborting: Unknown trade type: ${type}`)
      return
    }
    return {
      trade: await models[`${type.toLowerCase()}s`].byTid(offer.id),
      type
    }
  }

  const {trade, type} = await getTradeAndType()

  if (!trade) {
    console.log({trade, type})
    return
  }

  const user = await models.users.bySteamid(trade.steamid)

  switch (offerState) {
    case "Accepted":
      await models[type === "Deposit" ? "deposits" : "withdrawals"].setStatus("Accepted", offer.id)
      const api = await PM[type === "Deposit" ? "AccountsIncBalance" : "AccountsDecBalance"]({
        Player: trade.player,
        Amount: trade.items_value
      })
      console.log({api})
      if (api.Result === "Ok") {
        bank.to(user.steamid).emit("offer_done", {
          type,
          msg: `${type} #${offer.id} done!`
        })
        emitBalance(user.steamid, api.Balance, true)
        console.log(`${type} #${offer.id} for ${trade.player} finished`)
      }
      else console.error(`${type}: Failed to update balance for player ${trade.player}`)
      break
    case "Countered":
      await models[type === "Deposit" ? "deposits" : "withdrawals"].setStatus("Countered", offer.id)
      bank.to(user.steamid).emit("offer_countered", TXT.OFFER_COUNTERED(type, offer.id))
      break
    case "Declined": //(7)
      await models[type === "Deposit" ? "deposits" : "withdrawals"].setStatus("Declined", offer.id)
      bank.to(user.steamid).emit("offer_declined", TXT.OFFER_DECLINED(type, offer.id))
      break
    case "Active": //(2)
      //console.log(`#${offer.id} offerState: Active`);
      break
    case "InvalidItems": //(2)
      await models[type === "Deposit" ? "deposits" : "withdrawals"].setStatus("Invalid", offer.id)
      bank.to(user.steamid).emit("offer_invalid", `Offer #${offer.id} got invalid. Some items may be unavailable.`)
      break
    default:
      bank.to(user.steamid).emit("offer_fail", "Unexpected offer state. Contact an admin.")
      console.log(`Unhandled offer state: ${offerState}`)
      break
  }
})