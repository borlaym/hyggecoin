import { averageDifference } from "./util"

describe('utils', () => {
  it('averageDiff', () => {
      const arr = [0, 1, 2, 3, 4, 5, 6]
      expect(averageDifference(arr)).toEqual(1);
      const arr2 = [2, 3, 4, 5, 6, 7]
      expect(averageDifference(arr2)).toEqual(1);
      const arr3 = [5, 7, 8, 11, 20]
      expect(averageDifference(arr3)).toEqual(15 / 4)
  })
})