const IS_PRODUCTION = false;

export default class BinanceService {
    constructor() {
        this.binance = window['BinanceChain']

        this.binance.on('chainChanged', () => window.location.reload());
        this.binance.on('accountsChanged', () => window.location.reload());
    }

    getAccount() {
        return new Promise((resolve, reject) => {
            const net = IS_PRODUCTION ? 'binance smart chain' : 'binance smart chain test'
            const usedNet = IS_PRODUCTION ? '0x38' : '0x61'
            const netVersion = this.binance.chainId

            if (netVersion === usedNet) {
                this.binance.request({ method: 'eth_requestAccounts' })
                    .then(account => resolve({
                        address: account[0]
                    }))
                    .catch(_ => reject({ errorMsg: 'Not authorized' }))
            } else {
                reject({
                    errorMsg: 'Please choose ' + net + ' network in binance wallet.'
                })
            }

        })
    }
}