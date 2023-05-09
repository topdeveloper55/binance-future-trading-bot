const Web3 = require('web3');
const token_tickers = ["BTC", "ETH", "BNB", "XRP", "DOGE", "ADA", "MATIC", "DOT", "LTC", "SHIB", "TRX", "SOL", "UNI", "AVAX", "LINK", "XMR", "ATOM", "ETC", "XLM", "BCH", "APE",
    "ALGO", "QNT", "FIL", "VET", "NEAR", "HBAR", "ICP", "EGLD", "EOS", "FLOW", "XTZ", "CHZ", "AAVE", "THETA", "SAND", "ZEC", "FTM", "MKR", "APT", "XEC", "KLAY", "DASH", "NEO",
    "GRT", "SNX", "RUNE", "BAT", "CRV", "1INCH", "LRC", "LDO", "IMX", "XEM", "KAVA", "ENJ", "ZIL", "AR", "HOT", "CVX", "COMP", "CELO", "BAL", "ENS", "RVN", "SUSHI", "ROSE", "YFI",
    "KSM", "OP", "GMT", "QTUM", "IOTX", "MASK", "ANKR", "ONE", "LPT", "JASMY", "RSR", "ICX", "ZRX", "OMG", "ONT", "BNX", "IOST", "WOO", "SFP", "AUDIO", "STORJ",
    "SXP", "INJ", "PEOPLE", "OCEAN", "DYDX", "KNC", "SKL", "ANT", "RLC", "CELR", "CHR", "API3", "COTI", "CTSI", "ALPHA", "DENT", "BAND", "CTK", "SPELL", "REEF", "NKN",
    "STG", "LEVER", "TLM", "OGN", "C98", "STMX", "GAL", "MTL", "DODO", "ALICE", "ATA", "DUSK", "ARPA", "BAKE", "TRB", "LIT", "TOMO", "LINA", "FLM", "DAR", "IOTA", "BLZ", 
    "HNT", "BEL", "AXS", "MANA", "DGB", "GTC"];
const Binance = require('node-binance-api');
const apiK = "";
const apiS = "";





const binance = new Binance().options({
    APIKEY: apiK,
    APISECRET: apiS
  });
const criteria = 5;
const time = 20;

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const main = async () => {
    console.log(`Criteria is ${criteria}%`);
    while (1) {
        for (let i = 0; i < token_tickers.length; i++) {
            try {
                let data = await fetch(`https://api.binance.com/api/v3/ticker?symbol=${token_tickers[i]}USDT&windowSize=${time}m`, { method: 'GET', headers: { accept: 'application/json' } });
                data = await data.json();
                if(!data.hasOwnProperty("priceChangePercent")) console.log("Not received data!", token_tickers[i], data);
                if (Math.abs(Number(data?.priceChangePercent)) >= criteria) {
                    //set leverage
                    let symbol = `${token_tickers[i]}USDT`;
                    let buf = await binance.futuresLeverage(`${token_tickers[i]}USDT`, 10);
                    let leverage = 10;
                    if(buf.msg == "Invalid symbol.") {
                        await binance.futuresLeverage(`${token_tickers[i]}BUSD`, 8);
                        symbol = `${token_tickers[i]}BUSD`;
                        leverage = 8;
                    }
                    //log console
                    const currentDate = new Date();
                    console.log(`${currentDate.getMonth()+1}/${currentDate.getDate()}`, `${currentDate.getHours()}:${currentDate.getMinutes()}`, "->>", token_tickers[i], `${time}mins`, data?.lastPrice, data?.priceChangePercent);
                    let mins = currentDate.getMinutes() % 15;
                    mins = 14 - mins;
                    await sleep(mins * 60 * 1000);
                    await sleep(30 * 1000);
                    //set the order amount
                    data = await binance.futuresAccount(); 
                    let orderAmt = Number(data.totalWalletBalance) * 0.8;
                    data = await fetch(`https://api.binance.com/api/v3/ticker?symbol=${token_tickers[i]}USDT&windowSize=${time}m`, { method: 'GET', headers: { accept: 'application/json' } });
                    data = await data.json();
                    let price = Number(data.lastPrice);
                    orderAmt = orderAmt * leverage / price;
                    //set side
                    let side = data.priceChangePercent > 0 ? "SELL" : "BUY";
                    //place order
                    await binance.futuresOrder(side, symbol, orderAmt);
                    console.log("Open the position");
                    let startTime = Date.now();
                    //find close condition
                    while(1) {
                        data = await fetch(`https://api.binance.com/api/v3/ticker?symbol=${token_tickers[i]}USDT&windowSize=${time}m`, { method: 'GET', headers: { accept: 'application/json' } });
                        data = await data.json();
                        if(side == "BUY") {
                            if(Number(data.lastPrice) >= price * 1.03 || Number(data.lastPrice) <= price * 0.98) {
                                await binance.futuresOrder("SELL", symbol, orderAmt);
                                await sleep(3600 * 1000 + startTime - Date.now());
                                console.log("Close the position");
                                break;
                            }
                        } else {
                            if(Number(data.lastPrice) >= price * 1.02 || Number(data.lastPrice) <= price * 0.97) {
                                await binance.futuresOrder("BUY", symbol, orderAmt);
                                console.log("Close the position");
                                break;
                            }
                        }
                        if((Date.now() - startTime) >= 3600000) {
                            if(side == "BUY") await binance.futuresOrder("SELL", symbol, orderAmt);
                            else await binance.futuresOrder("BUY", symbol, orderAmt);
                            console.log("Close the position");
                            break;
                        }                    
                        await sleep(50);
                    }                 
                }
                await sleep(50);
            } catch(e) {
                console.log("Not connected!", token_tickers[i]);
            }
        }
    }
}
main();


