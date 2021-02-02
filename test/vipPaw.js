const BN = require("bn.js");
const chai = require("chai");
const { expect, assert } = require("chai");
const expectRevert = require("./utils/expectRevert.js");
const helper = require("openzeppelin-test-helpers/src/time.js");
const time = require("openzeppelin-test-helpers/src/time.js");
chai.use(require("chai-bn")(BN));

require('dotenv').config();
const {
    TOKEN_PRICE,
    SOFTCAP_IN_TOKENS,
    OPEN_CROWDSALE_TIME,
    CLOSE_CROWDSALE_TIME,
    MAX_SUPPLY,
    NAME,
    SYMBOL,
    MAX_TOKENS_TO_BUY_IN_TX_KOVAN
} = process.env;

const MINUS_ONE = new BN(-1);
const ZERO = new BN(0);
const ONE = new BN(1);
const TWO = new BN(2);
const THREE = new BN(3);
const FOUR = new BN(4);
const FIVE = new BN(5);
const SIX = new BN(6);
const SEVEN = new BN(7);
const EIGHT = new BN(8);
const NINE = new BN(9);
const TEN = new BN(10);

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const VipPaw = artifacts.require('VipPaw');

contract(
    'VipPaw-test',
    ([
        VipPawOwner,
        user1,
        user2
    ]) => {
        let VipPawInst;
        let openTime;
        let closeTime;

        beforeEach(async () => {
            // Init contracts
            let timeNow = new BN((await web3.eth.getBlock("latest")).timestamp);
            openTime = timeNow;
            closeTime = openTime.add(new BN(60 * 60 * 24));

            VipPawInst = await VipPaw.new(
                NAME,
                SYMBOL,
                TOKEN_PRICE,
                SOFTCAP_IN_TOKENS,
                MAX_SUPPLY,
                openTime,
                closeTime,
                MAX_TOKENS_TO_BUY_IN_TX_KOVAN,
                {from: VipPawOwner}
            );
        })

        it("#0 Deploy test", async () => {
            expect((await VipPawInst.tokenPrice()).toString()).to.be.equals(TOKEN_PRICE)
            expect((await VipPawInst.softCapInTokens()).toString()).to.be.equals(SOFTCAP_IN_TOKENS)
            expect(await VipPawInst.moneyCollected()).to.be.bignumber.that.equals(ZERO)
            expect((await VipPawInst.maxSupply()).toString()).to.be.equals(MAX_SUPPLY)
            expect(await VipPawInst.name()).to.be.equals(NAME);
            expect(await VipPawInst.symbol()).to.be.equals(SYMBOL);
            expect(await VipPawInst.totalSupply()).to.be.bignumber.that.equals(ZERO)
            expect(await VipPawInst.owner()).to.be.equals(VipPawOwner);
        })

        it("#1 Test open and close time of crowdsale", async () => {
            // test buy before open time
            let timeNow = new BN((await web3.eth.getBlock("latest")).timestamp);
            let openTime = timeNow.add(new BN(60 * 60 * 24));
            let closeTime = openTime.add(new BN(60 * 60 * 24));

            VipPawInst = await VipPaw.new(
                NAME,
                SYMBOL,
                TOKEN_PRICE,
                SOFTCAP_IN_TOKENS,
                MAX_SUPPLY,
                openTime,
                closeTime,
                MAX_TOKENS_TO_BUY_IN_TX_KOVAN,
                {from: VipPawOwner}
            );

            await expectRevert(
                VipPawInst.buyToken(ONE, {from: user1, value: TOKEN_PRICE}),
                "VipPaw: Crowdsale is closed"
            );

            await helper.increase(openTime.sub(timeNow));
            await VipPawInst.buyToken(ONE, {from: user1, value: TOKEN_PRICE});

            await helper.increase(closeTime.sub(timeNow));
            await expectRevert(
                VipPawInst.buyToken(ONE, {from: user1, value: TOKEN_PRICE}),
                "VipPaw: Crowdsale is closed"
            );
        })

        it("#2 Test token buy and cashback", async () => {
            let tokenPrice = new BN(TOKEN_PRICE);
            let numTokens = ONE;
            await expectRevert(
                VipPawInst.buyToken(numTokens, {from: user1, value: tokenPrice.sub(ONE)}),
                "VipPaw: Wrong amount of money"
            );
            await expectRevert(
                VipPawInst.buyToken(numTokens, {from: user1, value: tokenPrice.add(ONE)}),
                "VipPaw: Wrong amount of money"
            );
            await expectRevert(
                VipPawInst.buyToken(numTokens, {from: user1, value: tokenPrice.mul(THREE)}),
                "VipPaw: Wrong amount of money"
            );
            numTokens = TWO;
            await expectRevert(
                VipPawInst.buyToken(numTokens, {from: user1, value: tokenPrice.mul(THREE)}),
                "VipPaw: Wrong amount of money"
            );
            numTokens = THREE;
            await expectRevert(
                VipPawInst.buyToken(numTokens, {from: user1, value: tokenPrice.mul(numTokens).add(ONE)}),
                "VipPaw: Wrong amount of money"
            );
            await expectRevert(
                VipPawInst.buyToken(numTokens, {from: user1, value: tokenPrice.mul(numTokens).sub(ONE)}),
                "VipPaw: Wrong amount of money"
            );
            numTokens = new BN(MAX_SUPPLY).add(ONE);
            await expectRevert(
                VipPawInst.buyToken(numTokens, {from: user1, value: tokenPrice.mul(numTokens)}),
                "VipPaw: count must be not bigger than maxTokensToBuyInTx"
            );
            await VipPawInst.setMaxTokensToBuyInTx(numTokens, {from: VipPawOwner});
            await expectRevert(
                VipPawInst.buyToken(numTokens, {from: user1, value: tokenPrice.mul(numTokens)}),
                "VipPaw: Wrong amount of tokens to purchase"
            );
            numTokens = ZERO;
            await expectRevert(
                VipPawInst.buyToken(numTokens, {from: user1, value: tokenPrice.mul(numTokens)}),
                "VipPaw: Wrong amount of tokens to purchase"
            );
            await VipPawInst.setMaxTokensToBuyInTx(MAX_TOKENS_TO_BUY_IN_TX_KOVAN, {from: VipPawOwner});

            expect(await VipPawInst.balanceOf(user1)).to.be.bignumber.that.equals(ZERO);
            numTokens = ONE;
            await VipPawInst.buyToken(numTokens, {from: user1, value: tokenPrice.mul(numTokens)});
            expect(await VipPawInst.balanceOf(user1)).to.be.bignumber.that.equals(ONE);

            numTokens = THREE;
            await VipPawInst.buyToken(numTokens, {from: user1, value: tokenPrice.mul(numTokens)});
            expect(await VipPawInst.balanceOf(user1)).to.be.bignumber.that.equals(FOUR);
            expect(await VipPawInst.moneyCollected()).to.be.bignumber.that.equals(tokenPrice.mul(FOUR));
            expect(await VipPawInst.tokenOfOwnerByIndex(user1, ZERO)).to.be.bignumber.that.equals(ZERO);
            expect(await VipPawInst.tokenOfOwnerByIndex(user1, ONE)).to.be.bignumber.that.equals(ONE);
            expect(await VipPawInst.tokenOfOwnerByIndex(user1, TWO)).to.be.bignumber.that.equals(TWO);
            expect(await VipPawInst.tokenOfOwnerByIndex(user1, THREE)).to.be.bignumber.that.equals(THREE);
        })

        it("#3 Test end of crowdsale with reach of hard cap", async () => {
            let softCap = TWO;
            let hardCap = TEN;

            let timeNow = new BN((await web3.eth.getBlock("latest")).timestamp);
            let openTime = timeNow;
            let closeTime = openTime.add(new BN(60 * 60 * 24));

            VipPawInst = await VipPaw.new(
                NAME,
                SYMBOL,
                TOKEN_PRICE,
                softCap,
                hardCap,
                openTime,
                closeTime,
                MAX_TOKENS_TO_BUY_IN_TX_KOVAN,
                {from: VipPawOwner}
            );

            numTokens = TEN;
            let tokenPrice = new BN(TOKEN_PRICE);
            await VipPawInst.buyToken(numTokens, {from: user1, value: tokenPrice.mul(numTokens)});

            expect(await VipPawInst.balanceOf(user1)).to.be.bignumber.that.equals(numTokens);
            expect(await VipPawInst.moneyCollected()).to.be.bignumber.that.equals(tokenPrice.mul(numTokens));

            await expectRevert(
                VipPawInst.withdraw({from: user1, gasPrice: ZERO}),
                "Ownable: caller is not the owner"
            );

            let ethBalanceOfVipPawOwnerBefore = new BN(await web3.eth.getBalance(VipPawOwner));
            await VipPawInst.withdraw({from: VipPawOwner, gasPrice: ZERO});
            let ethBalanceOfVipPawOwnerAfter = new BN(await web3.eth.getBalance(VipPawOwner));
            expect(ethBalanceOfVipPawOwnerAfter.sub(ethBalanceOfVipPawOwnerBefore)).to.be.bignumber.that.equals(
                tokenPrice.mul(numTokens)
            );

            await expectRevert(
                VipPawInst.withdraw({from: VipPawOwner, gasPrice: ZERO}),
                "VipPaw: Nothing to return"
            );
        })

        it("#4 Test end of crowdsale with reach of soft cap and not reach hard cap", async () => {
            let softCap = TWO;
            let hardCap = TEN;

            let timeNow = new BN((await web3.eth.getBlock("latest")).timestamp);
            let openTime = timeNow;
            let closeTime = openTime.add(new BN(60 * 60 * 24));

            VipPawInst = await VipPaw.new(
                NAME,
                SYMBOL,
                TOKEN_PRICE,
                softCap,
                hardCap,
                openTime,
                closeTime,
                MAX_TOKENS_TO_BUY_IN_TX_KOVAN,
                {from: VipPawOwner}
            );

            numTokens = TWO;
            let tokenPrice = new BN(TOKEN_PRICE);
            await VipPawInst.buyToken(numTokens, {from: user1, value: tokenPrice.mul(numTokens)});

            expect(await VipPawInst.balanceOf(user1)).to.be.bignumber.that.equals(numTokens);
            expect(await VipPawInst.moneyCollected()).to.be.bignumber.that.equals(tokenPrice.mul(numTokens));

            await expectRevert(
                VipPawInst.withdraw({from: user1, gasPrice: ZERO}),
                "Ownable: caller is not the owner"
            );
            await expectRevert(
                VipPawInst.withdraw({from: VipPawOwner, gasPrice: ZERO}),
                "VipPaw: Crowdsale is not closed"
            );

            timeNow = new BN((await web3.eth.getBlock("latest")).timestamp);
            await helper.increase(closeTime.sub(timeNow));

            await expectRevert(
                VipPawInst.withdraw({from: user1, gasPrice: ZERO}),
                "Ownable: caller is not the owner"
            );

            let ethBalanceOfVipPawOwnerBefore = new BN(await web3.eth.getBalance(VipPawOwner));
            await VipPawInst.withdraw({from: VipPawOwner, gasPrice: ZERO});
            let ethBalanceOfVipPawOwnerAfter = new BN(await web3.eth.getBalance(VipPawOwner));
            expect(ethBalanceOfVipPawOwnerAfter.sub(ethBalanceOfVipPawOwnerBefore)).to.be.bignumber.that.equals(
                tokenPrice.mul(numTokens)
            );

            await expectRevert(
                VipPawInst.withdraw({from: VipPawOwner, gasPrice: ZERO}),
                "VipPaw: Nothing to return"
            );
        })

        it("#5 Test end of crowdsale with no reach of soft cap", async () => {
            let softCap = EIGHT;
            let hardCap = TEN;

            let timeNow = new BN((await web3.eth.getBlock("latest")).timestamp);
            let openTime = timeNow;
            let closeTime = openTime.add(new BN(60 * 60 * 24));

            VipPawInst = await VipPaw.new(
                NAME,
                SYMBOL,
                TOKEN_PRICE,
                softCap,
                hardCap,
                openTime,
                closeTime,
                MAX_TOKENS_TO_BUY_IN_TX_KOVAN,
                {from: VipPawOwner}
            );

            numTokens = FIVE;
            let tokenPrice = new BN(TOKEN_PRICE);
            await VipPawInst.buyToken(numTokens, {from: user1, value: tokenPrice.mul(numTokens)});

            expect(await VipPawInst.balanceOf(user1)).to.be.bignumber.that.equals(numTokens);
            expect(await VipPawInst.moneyCollected()).to.be.bignumber.that.equals(tokenPrice.mul(numTokens));

            await expectRevert(
                VipPawInst.withdraw({from: user1, gasPrice: ZERO}),
                "Ownable: caller is not the owner"
            );
            await expectRevert(
                VipPawInst.withdraw({from: VipPawOwner, gasPrice: ZERO}),
                "VipPaw: Crowdsale is not closed"
            );

            timeNow = new BN((await web3.eth.getBlock("latest")).timestamp);
            await helper.increase(closeTime.sub(timeNow));

            await expectRevert(
                VipPawInst.burnTokensToRefund(ZERO, {from: user2}),
                "VipPaw: Need to have vip paw cards to refund"
            );
            ethBalanceOfUser1Before = new BN(await web3.eth.getBalance(user1));
            await VipPawInst.burnTokensToRefund(ZERO, {from: user1, gasPrice: ZERO});
            ethBalanceOfUser1After = new BN(await web3.eth.getBalance(user1));
            expect(await VipPawInst.balanceOf(user1)).to.be.bignumber.that.equals(ZERO);
            expect(ethBalanceOfUser1After.sub(ethBalanceOfUser1Before)).to.be.bignumber.that.equals(tokenPrice.mul(numTokens));

            expect(await VipPawInst.moneyCollected()).to.be.bignumber.that.equals(ZERO);

            await expectRevert(
                VipPawInst.burnTokensToRefund(ZERO, {from: user1}),
                "VipPaw: Need to have vip paw cards to refund"
            );
        })

        it("#6 Test transfer", async () => {
            let numTokens = TWO;
            let tokenPrice = new BN(TOKEN_PRICE);
            await VipPawInst.buyToken(numTokens, {from: user1, value: tokenPrice.mul(numTokens)});

            expect(await VipPawInst.balanceOf(user1)).to.be.bignumber.that.equals(numTokens);

            await expectRevert(
                VipPawInst.transferFrom(user1, user2, ZERO, {from: user1}),
                "VipPaw: Transfers is not opened yet"
            );
            await expectRevert(
                VipPawInst.transferFrom(user1, user2, ONE, {from: user1}),
                "VipPaw: Transfers is not opened yet"
            );

            timeNow = new BN((await web3.eth.getBlock("latest")).timestamp);
            await helper.increase(closeTime.sub(timeNow));

            let ethBalanceOfUser1Before = new BN(await web3.eth.getBalance(user1));
            await VipPawInst.burnTokensToRefund(ONE, {from: user1, gasPrice: ZERO});
            let ethBalanceOfUser1After = new BN(await web3.eth.getBalance(user1));
            expect(await VipPawInst.balanceOf(user1)).to.be.bignumber.that.equals(ONE);
            expect(ethBalanceOfUser1After.sub(ethBalanceOfUser1Before)).to.be.bignumber.that.equals(tokenPrice);

            await VipPawInst.openTransfers({from: VipPawOwner});

            await VipPawInst.transferFrom(user1, user2, ONE, {from: user1});

            expect(await VipPawInst.balanceOf(user1)).to.be.bignumber.that.equals(ZERO);
            expect(await VipPawInst.balanceOf(user2)).to.be.bignumber.that.equals(ONE);

            let ethBalanceOfUser2Before = new BN(await web3.eth.getBalance(user2));
            await VipPawInst.burnTokensToRefund(ONE, {from: user2, gasPrice: ZERO});
            let ethBalanceOfUser2After = new BN(await web3.eth.getBalance(user2));
            expect(await VipPawInst.balanceOf(user2)).to.be.bignumber.that.equals(ZERO);
            expect(ethBalanceOfUser2After.sub(ethBalanceOfUser2Before)).to.be.bignumber.that.equals(tokenPrice);
        })
    }
)