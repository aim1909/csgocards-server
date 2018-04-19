require("dotenv").config()
require("./index")

process.on("uncaughtException", err => console.error(`uncaughtException`, err))
process.on("unhandledRejection", (reason, promise) => console.warn(`unhandledRejection`, reason, promise))
process.on("warning", warning => console.log(`warning`, warning))