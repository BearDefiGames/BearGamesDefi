const BN = require('bn.js');

require('dotenv').config();
const {
    ERC20_NAME,
    ERC20_SYMBOL,
    ERC20_SUPPLY,
    OWNER
} = process.env;

const Token = artifacts.require("Token");

const debug = "false";

const ZERO = new BN(0);

module.exports = async function (deployer, network) {
    if (network == "test" || network == "development")
        return;

    await deployer.deploy(
        Token,
        ERC20_SUPPLY,
        ERC20_NAME,
        ERC20_SYMBOL
    );
    let TokenInst = await Token.deployed();
    await TokenInst.transfer(OWNER, ERC20_SUPPLY);
    console.log("Token address =", TokenInst.address);
};