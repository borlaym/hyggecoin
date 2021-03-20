const crypto = require('crypto');

export function getHash(content: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(content);
  return hash.digest('hex');
}

export function toHexString(byteArray: any[]): string {
  return Array.from(byteArray, (byte: any) => {
      return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('');
};

/**
 * Split an array into arrays of a fixed length
 * Leftover items are included in the last array of fewer than the given length items
 */
export function chunk<T>(arr: T[], chunkLength: number): T[][] {
  function getNextChunk(remainingArray: T[], collectedArrays: T[][]): T[][] {
    if (remainingArray.length < chunkLength) {
      return [...collectedArrays, remainingArray]
    }
    return getNextChunk(remainingArray.slice(chunkLength), [...collectedArrays, remainingArray.slice(0, chunkLength)]);
  }
  return getNextChunk(arr, []);
}

/**
 * The average of the difference between items in an array
 */
export function averageDifference(arr: number[]): number {
  return (arr[arr.length - 1] - arr[0]) / (arr.length - 1);
}