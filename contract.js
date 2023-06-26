import Web3 from 'web3';

import { rpcUrl } from './config.js';
import { getAbiByRelativePath } from './general.helper.js';

export const web3 = new Web3(rpcUrl);

const multicallAbi = getAbiByRelativePath('./multicallAbi.json');
const nftAbi = getAbiByRelativePath('./nftAbi.json');

export const multicallContractAddress = web3.utils.toChecksumAddress('0xca11bde05977b3631167028862be2a173976ca11');
export const nftContractAddress = web3.utils.toChecksumAddress('0xd89dbbd35c24e07c7727bf1ef36cd1f02aea158e');

export const nftContract = new web3.eth.Contract(nftAbi, nftContractAddress);

export const multicallContract = new web3.eth.Contract(multicallAbi, multicallContractAddress);
