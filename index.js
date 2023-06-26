import { ethers } from 'ethers';
import { importETHWallets } from './accs.js';

import { explorer, sleepFrom, sleepTo } from './config.js';
import { multicallContract, multicallContractAddress, nftContract, nftContractAddress, web3 } from './contract.js';
import { randomIntInRange, sleep } from './general.helper.js';

const ethWallets = await importETHWallets();

if (!ethWallets) {
  console.log('RetroPFG3. No wallets found.');
  process.exit(0);
}

// const checkTransactionStatus = async (hash, address, privateKey) => {
//   console.log(`RetroPFG3. ${address}: Waiting for transaction confirmation: ${explorer}/tx/${hash}`);

//   let status;
//   let secondsWaited = 0;

//   const intervalId = setInterval(async () => {
//     status = await web3.eth.getTransactionReceipt(hash);

//     if (status && status.status) {
//       console.log(`RetroPFG3. ${address}: NFT is successfully minted`);
//       clearInterval(intervalId);
//     }

//     secondsWaited++;

//     if (secondsWaited >= 100) {
//       console.log(`RetroPFG3. ${address}: Transaction took to long to confirm. Sending the new one...`);
//       mint(privateKey);
//       clearInterval(intervalId);
//     }
//   }, 1000);
// };

const isNftNeeded = async (address) => {
  const nftCount = await nftContract.methods.balanceOf(address).call();

  if (nftCount === '1') {
    console.log(`RetroPFG3 => ${address}: You already have this NFT.`);
    return false;
  }

  return true;
};

const mint = async (privateKey) => {
  const ethAccount = await web3.eth.accounts.privateKeyToAccount('0x' + privateKey);
  const address = web3.utils.toChecksumAddress(ethAccount.address);

  try {
    const nftNeeded = await isNftNeeded(address);

    if (!nftNeeded) {
      return { needed: false };
    }

    const encoder = new ethers.utils.AbiCoder();

    const mintMethodId = '0x40c10f19';
    const encodedStringInHex = web3.utils.stripHexPrefix(encoder.encode(['address', 'uint256'], [address, 1]));
    const mintData = web3.utils.hexToBytes(`${mintMethodId}${encodedStringInHex}`);

    const args = [
      {
        target: nftContractAddress,
        allowFailure: false,
        callData: mintData,
        value: 0,
      },
      {
        target: web3.utils.toChecksumAddress('0xAcCC1fe6537eb8EB56b31CcFC48Eb9363e8dd32E'),
        allowFailure: false,
        callData: '0x',
        value: 440000000000000,
      },
    ];

    const txAbi = await multicallContract.methods.aggregate3Value(args).encodeABI();
    const transactionCount = await web3.eth.getTransactionCount(address);

    const gas = await multicallContract.methods
      .aggregate3Value(args)
      .estimateGas({ from: address, nonce: transactionCount, value: 440000000000000 });

    const gasPrice = await web3.eth.getGasPrice();

    const transactionObject = {
      from: address,
      to: multicallContractAddress,
      nonce: transactionCount,
      value: 440000000000000,
      gas,
      maxFeePerGas: parseInt(Number(gasPrice) * 1.2),
      maxPriorityFeePerGas: parseInt(gasPrice),
      data: txAbi,
    };

    const signedTx = await web3.eth.accounts.signTransaction(transactionObject, privateKey);

    web3.eth
      .sendSignedTransaction(signedTx.rawTransaction)
      .on('transactionHash', async (hash) => {
        console.log(`RetroPGF3. ${address}: Transaction is sent! ${explorer}/tx/${hash}`);
      })
      .on('error', async (error) => {
        {
          if (error?.message.includes('insufficient funds')) {
            console.log(`RetroPGF3. ${address}: Unsufficient balance.`);
          } else {
            console.log(`RetroPGF3. ${address}: Error ->`);
            console.dir(error);
            await sleep(60000); // 1 min to prevent spam
            return mint(ethWalletKey);
          }
        }
      });
  } catch (error) {
    if (error?.message.includes('insufficient funds')) {
      console.log(`RetroPGF3. ${address}: Unsufficient balance.`);
    } else {
      console.log(`RetroPGF3. ${address}: Error ->`);
      console.dir(error);
      await sleep(60000); // 1 min to prevent spam
      return mint(ethWalletKey);
    }
  }
};

// main loop
for (let i = 0; i < ethWallets.length; i++) {
  const result = await mint(ethWallets[i]);

  if (result && result.needed === false) {
    // skip sleep, if nft is already on the account
    continue;
  }

  if (i < ethWallets.length - 1) {
    const timing = randomIntInRange(sleepFrom, sleepTo);
    console.log(`RetroPGF3. Waiting for ${timing} seconds before next mint...`);
    await sleep(timing * 1000);
  }
}
