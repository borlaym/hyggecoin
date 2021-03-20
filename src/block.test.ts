import { DIFFICULTY_ALLOWED_DIFFERENCE_MULTIPLIER, DIFFICULTY_EXPECTED_MINING_TIME, DIFFICULTY_STARTING, getDifficultyForNextBlockFromTimestamps, HOUR, MINUTE } from './block';

/**
 * [fromIndex (inclusive), toIndex (exclusive), increase]
 */
type GeneratorList = Array<[number, number, number]>;

function generateTimestampSequence(length: number, generator: GeneratorList) {
  const array = new Array(length).fill(true);
  for (let i = 0; i < array.length; i ++) {
    if (i === 0) {
      array[i] = 0;
    } else {
      const g = generator.find(g => i >= g[0] && i < g[1]);
      if (!g) {
        throw new Error(`Generator not found for index ${i}`);
      }
      array[i] = array[i - 1] + g[2];
    }
  }
  return array;
}


describe('blocks and blockchains', () => {
  describe('difficulty', () => {
      it('should not change from default if it shouldn\'t', () => {
        const timestamps = generateTimestampSequence(13, [
          [0, 10, DIFFICULTY_EXPECTED_MINING_TIME],
          [10, 20, DIFFICULTY_EXPECTED_MINING_TIME],
          [20, 100, DIFFICULTY_EXPECTED_MINING_TIME]
        ]);
        expect(getDifficultyForNextBlockFromTimestamps(timestamps)).toEqual(DIFFICULTY_STARTING);
      })
      it('should not matter what is in the last blocks that don\'t fill a complete chunk', () => {
        const timestamps = generateTimestampSequence(13, [
          [0, 10, DIFFICULTY_EXPECTED_MINING_TIME],
          [10, 20, DIFFICULTY_EXPECTED_MINING_TIME],
          [20, 100, 2 * DIFFICULTY_EXPECTED_MINING_TIME]
        ]);
        expect(getDifficultyForNextBlockFromTimestamps(timestamps)).toEqual(DIFFICULTY_STARTING);
      })
      it('should decrease the difficulty if the average mining time is lower than expected', () => {
        const timestamps = generateTimestampSequence(13, [
          [0, 10, DIFFICULTY_EXPECTED_MINING_TIME * (1 - DIFFICULTY_ALLOWED_DIFFERENCE_MULTIPLIER) - 1],
          [10, 20, DIFFICULTY_EXPECTED_MINING_TIME],
          [20, 100, 2 * DIFFICULTY_EXPECTED_MINING_TIME]
        ]);
        expect(getDifficultyForNextBlockFromTimestamps(timestamps)).toEqual(DIFFICULTY_STARTING - 1);
      })
      it('should increase the difficulty if the average mining time is higher than expected', () => {
        const timestamps = generateTimestampSequence(13, [
          [0, 10, DIFFICULTY_EXPECTED_MINING_TIME * (1 + DIFFICULTY_ALLOWED_DIFFERENCE_MULTIPLIER) + 1],
          [10, 20, DIFFICULTY_EXPECTED_MINING_TIME],
          [20, 100, 2 * DIFFICULTY_EXPECTED_MINING_TIME]
        ]);
        expect(getDifficultyForNextBlockFromTimestamps(timestamps)).toEqual(DIFFICULTY_STARTING + 1);
      })
      it('should be able to both increase and decrease', () => {
        const timestamps = generateTimestampSequence(33, [
          [0, 10, DIFFICULTY_EXPECTED_MINING_TIME * (1 + DIFFICULTY_ALLOWED_DIFFERENCE_MULTIPLIER) + 1],
          [10, 20, DIFFICULTY_EXPECTED_MINING_TIME * (1 - DIFFICULTY_ALLOWED_DIFFERENCE_MULTIPLIER) - 1],
          [20, 30, 2 * DIFFICULTY_EXPECTED_MINING_TIME * (1 + DIFFICULTY_ALLOWED_DIFFERENCE_MULTIPLIER) + 1],
          [30, 100, DIFFICULTY_EXPECTED_MINING_TIME]
        ]);
        expect(getDifficultyForNextBlockFromTimestamps(timestamps)).toEqual(DIFFICULTY_STARTING + 1);
      })
  })
})