/* eslint-disable padded-blocks */
import assert from 'assert';
import {
  isColliding,
  getCollidedItems,
  getDiffYToAvoidCollision,
  moveCollidedItems,
  tryFitToPage,
  groupIntoPages,
  ROWS_PER_PAGE,
} from '../../src/utilities/dashboard';

describe('Utility: Dashboard', () => {
  describe('isColliding()', () => {

    it('from left', () => {
      const result = isColliding(
        { x: 0, y: 0, h: 2, w: 2 },
        { x: 1, y: 0, h: 2, w: 2 }
      );
      assert(result);
    });

    it('from right', () => {
      const result = isColliding(
        { x: 10, y: 0, h: 2, w: 2 },
        { x: 9, y: 0, h: 2, w: 2 }
      );
      assert(result);
    });

    it('no collision', () => {
      const result = isColliding(
        { x: 10, y: 0, h: 2, w: 2 },
        { x: 5, y: 0, h: 2, w: 2 }
      );
      assert.equal(result, false);
    });

    it('no collision', () => {
      const result = isColliding(
        { x: 0, y: 1, h: 2, w: 2 },
        { x: 0, y: 3, h: 2, w: 2 }
      );
      assert.equal(result, false);
    });

  });

  it('getCollidedItems()', () => {
    const result = getCollidedItems([
      { x: 0, y: 1, h: 2, w: 2 },
      { x: 0, y: 2, h: 2, w: 2 },
      { x: 0, y: 3, h: 2, w: 2 },
      { x: 0, y: 4, h: 2, w: 2 },
      { x: 0, y: 5, h: 2, w: 2 },
      { x: 0, y: 6, h: 2, w: 2 },
    ]);
    assert.deepEqual(result, [
      { x: 0, y: 2, h: 2, w: 2 },
      { x: 0, y: 3, h: 2, w: 2 },
      { x: 0, y: 4, h: 2, w: 2 },
      { x: 0, y: 5, h: 2, w: 2 },
      { x: 0, y: 6, h: 2, w: 2 },
    ]);
  });

  describe('getDiffYToAvoidCollision()', () => {
    it('below', () => {
      const result = getDiffYToAvoidCollision(
        [{ y: 1, h: 2, index: 0 }],
        { y: 2, h: 2, index: 1 }
      );
      assert.equal(result, 1);
    });

    it('inside', () => {
      const result = getDiffYToAvoidCollision(
        [{ y: 1, h: 4, index: 0 }],
        { y: 2, h: 2, index: 1 }
      );
      assert.equal(result, 3);
    });

    it('above', () => {
      const result = getDiffYToAvoidCollision(
        [{ y: 4, h: 4, index: 0 }],
        { y: 2, h: 3, index: 1 }
      );
      assert.equal(result, 6);
    });

    it('below 2', () => {
      const result = getDiffYToAvoidCollision(
        [{ x: 0, y: 1, h: 2, w: 2, index: 0 }],
        { x: 0, y: 2, h: 2, w: 2, index: 1 }
      );
      assert.equal(result, 1);
    });

    it('below 3', () => {
      const result = getDiffYToAvoidCollision(
        [
          { x: 0, y: 1, h: 4, w: 2, index: 0 },
          { x: 0, y: 2, h: 4, w: 2, index: 1 },
          { x: 0, y: 4, h: 4, w: 2 },
        ],
        { x: 0, y: 2, h: 4, w: 2, index: 1 }
      );
      assert.equal(result, 3);
    });
  });

  describe('moveCollidedItems()', () => {
    const result = moveCollidedItems([
      { x: 0, y: 1, h: 2, w: 2 },
      { x: 0, y: 2, h: 2, w: 2 },
      { x: 0, y: 4, h: 2, w: 2 },
      { x: 0, y: 4, h: 2, w: 2 },
      { x: 0, y: 5, h: 2, w: 2 },
      { x: 0, y: 6, h: 2, w: 2 },
    ]);
    assert.deepStrictEqual(result, [
      { x: 0, y: 1, h: 2, w: 2 },
      { x: 0, y: 3, h: 2, w: 2 },
      { x: 0, y: 5, h: 2, w: 2 },
      { x: 0, y: 7, h: 2, w: 2 },
      { x: 0, y: 9, h: 2, w: 2 },
      { x: 0, y: 11, h: 2, w: 2 },
    ]);
  });

  describe('tryFitToPage()', () => {
    it('fits 1', () => {
      const result = tryFitToPage({ x: 0, y: 0, h: 2, w: 2 }, 0);
      assert(result);
    });

    it('fits 2', () => {
      const result = tryFitToPage({ x: 0, y: ROWS_PER_PAGE - 2, h: 2, w: 2 }, 0);
      assert(result);
    });

    it('fits 3', () => {
      const result = tryFitToPage({ x: 0, y: 0, h: ROWS_PER_PAGE, w: 2 }, 0);
      assert(result);
    });

    it('fits 4', () => {
      const result = tryFitToPage({ x: 0, y: ROWS_PER_PAGE, h: 2, w: 2 }, 1);
      assert(result);
    });

    it('fits 5', () => {
      const result = tryFitToPage({ x: 0, y: ROWS_PER_PAGE, h: ROWS_PER_PAGE, w: 2 }, 1);
      assert(result);
    });

    it('fits 6', () => {
      const result = tryFitToPage({ x: 0, y: ROWS_PER_PAGE * 2, h: 2, w: 2 }, 2);
      assert(result);
    });

    it('fits 7', () => {
      const result = tryFitToPage({ x: 0, y: 57, h: 4, w: 2 }, 5);
      assert(result);
    });

    it('fits 8', () => {
      const result = tryFitToPage({ x: 4, y: 11, h: 5, w: 4 }, 0);
      assert(result);
    });

    it('fits 9', () => {
      const result = tryFitToPage({ x: 0, y: 13, h: 4, w: 2 }, 0);
      assert.equal(result, false);
    });

    it('fits 10', () => {
      const result = tryFitToPage({ x: 4, y: 11, h: 3, w: 4 }, 0);
      assert(result);
    });
  });

  describe('groupIntoPages()', () => {
    it('1 column', () => {
      const result = groupIntoPages()([
        { x: 0, y: 1, h: 4, w: 2 },
        { x: 0, y: 2, h: 4, w: 2 },
        { x: 0, y: 4, h: 4, w: 2 },
        { x: 0, y: 4, h: 4, w: 2 },
        { x: 0, y: 5, h: 4, w: 2 },
        { x: 0, y: 6, h: 4, w: 2 },
      ]);
      assert.deepStrictEqual(result, [
        { x: 0, y: 1, h: 4, w: 2 },
        { x: 0, y: 5, h: 4, w: 2 },
        { x: 0, y: 9, h: 4, w: 2 },
        { x: 0, y: 16, h: 4, w: 2 },
        { x: 0, y: 20, h: 4, w: 2 },
        { x: 0, y: 24, h: 4, w: 2 },
      ]);
    });

    it('multi column', () => {
      const result = groupIntoPages()([
        { x: 0, y: 0, h: 11, w: 6 }, { x: 6, y: 0, h: 7, w: 6 },
        { x: 0, y: 11, h: 7, w: 4 }, { x: 4, y: 11, h: 3, w: 4 }, { x: 8, y: 7, h: 6, w: 4 },
                                     { x: 4, y: 16, h: 6, w: 4 }, { x: 8, y: 13, h: 6, w: 4 },
      ]);
      assert.deepStrictEqual(result, [
        { x: 0, y: 0, h: 11, w: 6 }, { x: 6, y: 0, h: 7, w: 6 },
                                     { x: 8, y: 7, h: 6, w: 4 }, { x: 4, y: 11, h: 3, w: 4 },
        { x: 0, y: 16, h: 7, w: 4 }, { x: 4, y: 16, h: 6, w: 4 }, { x: 8, y: 16, h: 6, w: 4 },
      ]);
    });

  });

});

