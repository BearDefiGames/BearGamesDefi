const BN = require('bn.js');

require('dotenv').config();
const {
    TOKEN_PRICE,
    SOFTCAP_IN_TOKENS,
    OPEN_CROWDSALE_TIME,
    CLOSE_CROWDSALE_TIME,
    MAX_SUPPLY,
    NAME,
    SYMBOL,
    OWNER,
    BASE_URI,
    DEFAULT_TOKEN_URI,
    MAX_TOKENS_TO_BUY_IN_TX_BSC,
    MAX_TOKENS_TO_BUY_IN_TX_ETH_MAINNET,
    MAX_TOKENS_TO_BUY_IN_TX_KOVAN,
    MAX_TOKENS_TO_BUY_IN_TX_ROPSTEN,
} = process.env;

const VipPaw = artifacts.require("VipPaw");

const debug = "false";

const ZERO = new BN(0);

module.exports = async function (deployer, network) {
    if (network == "test" || network == "development")
        return;

    let maxTokensToBuyInTx;
    if (network == "mainnet")
        maxTokensToBuyInTx = new BN(MAX_TOKENS_TO_BUY_IN_TX_ETH_MAINNET);
    else if (network == "bsc" || network == "bscTestnet")
        maxTokensToBuyInTx = new BN(MAX_TOKENS_TO_BUY_IN_TX_BSC);
    else if (network == "ropsten")
        maxTokensToBuyInTx = new BN(MAX_TOKENS_TO_BUY_IN_TX_ROPSTEN);
    else if (network == "kovan")
        maxTokensToBuyInTx = new BN(MAX_TOKENS_TO_BUY_IN_TX_KOVAN);
    else
        return;

    let numContracts;
    if (debug == "true")// && (network == "bsc" || network == "bscTestnet"))
        numContracts = new BN(5);
    else
        numContracts = new BN(1);

    let VipPawInstArray = [];

    for(i = 0; i < numContracts; ++i){
        if (debug == "true")
        {
            await deployer.deploy(
                VipPaw,
                NAME,
                SYMBOL,
                TOKEN_PRICE,
                new BN(500),
                new BN(1000),
                OPEN_CROWDSALE_TIME,
                CLOSE_CROWDSALE_TIME,
                maxTokensToBuyInTx
            );
        }
        else
        {
            await deployer.deploy(
                VipPaw,
                NAME,
                SYMBOL,
                TOKEN_PRICE,
                SOFTCAP_IN_TOKENS,
                MAX_SUPPLY,
                OPEN_CROWDSALE_TIME,
                CLOSE_CROWDSALE_TIME,
                maxTokensToBuyInTx
            );
        }
        let VipPawInst = await VipPaw.deployed();
        await VipPawInst.setBaseUri(BASE_URI);
        await VipPawInst.setDefaultTokenURI(DEFAULT_TOKEN_URI);
        await VipPawInst.transferOwnership(OWNER);
        VipPawInstArray.push(VipPawInst.address);
    }

    for(i = 0; i < VipPawInstArray.length; ++i){
        console.log(VipPawInstArray[i]);
    }
};