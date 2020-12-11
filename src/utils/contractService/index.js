import contractDetails from './contractDetails';
import decimals from './decimals';
import BigNumber from "bignumber.js";

export default class ContractService {

    constructor(BinanceService) {
        this.binanceService = BinanceService

        this.pawContract = this.binanceService.getContract(contractDetails.PAW.ABI, contractDetails.PAW.ADDRESS)
    }

    tokenPrice = async () => {
        const price = await this.pawContract.methods.tokenPrice().call()
        return new BigNumber(price).dividedBy(new BigNumber(10).pow(decimals.BNB)).toFixed()
    }

    isClosedCrowdsale = () => {
        return this.pawContract.methods.isClosedCrowdsale().call()
    }

    isRefund = () => {
        return this.pawContract.methods.isRefund().call()
    }

    balanceOf = async (address) => {
        return Number(await this.pawContract.methods.balanceOf(address).call())
    }

    tokenOfOwnerByIndex = (address, index) => {
        return this.pawContract.methods.tokenOfOwnerByIndex(address,index).call()
    }

    withdrawForUserWhenRefund = async (address) => {
        return this.pawContract.methods.withdrawForUserWhenRefund(address).call()
    }

    burnTokensToRefund = async (address, count) => {
        return await this.binanceService.sendTx('burnTokensToRefund',address,[count],0)
    }

    cashbackOfToken = async (id) => {
        const cashback = await this.pawContract.methods.cashbackOfToken(id).call()
        return new BigNumber(cashback).dividedBy(new BigNumber(10).pow(decimals.BNB)).toFixed()
    }

    getCashback = (address,tokenId) => {
        return this.binanceService.sendTx('getCashback',address,[tokenId],0)
    }

    buyManyTokens = async (address, count) => {
        try {
            const maxTokensToBuyInTx = await this.maxTokensToBuyInTx();
            const remainderCount = count % maxTokensToBuyInTx; // остаток
            const iterations = (count / maxTokensToBuyInTx + 1).toFixed();
            if (iterations < 2)
                return await this.buyTokens(address,count);
            for (let i = 0; i < iterations; i++) {
                if (i === iterations - 1) {
                    return await this.buyTokens(address,remainderCount)
                } else {
                    await this.buyTokens(address,maxTokensToBuyInTx)
                }
            }
            return
        } catch (e) {
            console.error(e);
        }
    }

    buyTokens = async (address, count) => {
        try {
            const tokenPrice = await this.tokenPrice();
            let amount = new BigNumber(count)
            .multipliedBy(new BigNumber(tokenPrice))
            .multipliedBy(new BigNumber(10).pow(decimals.BNB)).toFixed();
            amount = '0x' + (+amount).toString(16)
            return await this.binanceService.sendTx('buyToken',address,[count],amount)
        } catch (e) {
            console.error(e);
        }
    }

    maxTokensToBuyInTx = async () => {
        return await this.pawContract.methods.maxTokensToBuyInTx().call()
    }

}