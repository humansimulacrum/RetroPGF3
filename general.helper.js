import * as fs from 'fs';
import * as path from 'path';

const __dirname = path.resolve();

export const sleep = async (millis) => new Promise((resolve) => setTimeout(resolve, millis));

export const getAbiByRelativePath = (relativePath) => {
  return JSON.parse(fs.readFileSync(path.join(__dirname, relativePath), 'utf-8'));
};

/**
 * Random int number
 * @param {Integer} min
 * @param {Integer} max
 * @returns Random int number
 */

export const randomIntInRange = (min, max) => {
  return Math.floor(Math.random() * (max - min) + min);
};
