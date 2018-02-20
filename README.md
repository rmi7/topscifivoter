# TopSciFiVoter

![License](https://img.shields.io/github/license/rmi7/topscifivoter.svg?style=flat-square)

> Dapp to vote on your Top SciFi movies

## Prerequisites

To run it in the browser you need to install MetaMask browser extension.

## Setup

``` bash
# install truffle
npm i -g truffle

# install dependencies
npm install

# install testrpc
npm install -g ethereumjs-testrpc
```

## Run

```bash
# start testrpc
testrpc

# deploy smart contracts to testrpc (will use testrpc private key #1 to deploy)
truffle migrate

# serve with hot reload at localhost:8080
npm run dev

# import testrpc private key #1 into MetaMask in the browser, since that
# the owner of the contract and the only one allowed to "start" the voting round
```

## Usage
- only the owner(=account that deployed the contract) is allowed to "start" a voting round,
  if you use testrpc this will be private key \#1
- only 1 vote per account per movie
- 1 vote costs 1 ether
- after the vote ends an account can withdraw his bids
- you can switch between MetaMask accounts at any moment while using the app and
  it will correctly update everything
- sometimes due to a combination of cli commands MetaMask will say nonce too low,
  in that case restart your browser and it should all work again

## Test

```bash
# test smart contract
truffle test
```

## Notes

Solidity tests are not implemented yet, but will be in the future!

## Todo

It seems that all information can be retrieved from looking at historical Events.
So set more variables inside the smart contract to private, or is relying on Events
considered bad practice?!
