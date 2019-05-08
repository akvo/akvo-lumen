import { sortBy } from 'lodash';

export const ROWS_PER_PAGE = 16;
const LENGTH_DIMENSION = {
  x: 'w',
  y: 'h',
};

const sort = items => sortBy(items, [
  ({ y, h }) => y + h,
  'x',
]);

export const isOverlappingInAxis = (axisKey, unsortedA, unsortedB) => {
  const [a, b] = sortBy([unsortedA, unsortedB], axisKey);
  const a2 = a[axisKey] + a[LENGTH_DIMENSION[axisKey]];
  const b2 = b[axisKey] + b[LENGTH_DIMENSION[axisKey]];
  if (a[axisKey] <= b2 && a2 > b[axisKey]) {
    return true;
  }
  return false;
};

export const isColliding = (a, b) =>
  isOverlappingInAxis('x', a, b) &&
  isOverlappingInAxis('y', a, b);

export const getCollidedItems = items =>
  items.filter((item, i) =>
    isColliding(item, items[i - 1] || {})
  );

export const getDiffYToAvoidCollision = (collidedItems, item) =>
  collidedItems.reduce((maxOverlap, collidedItem) => {
    const { index, h, y } = collidedItem;
    return (
      (item.index === index || !isColliding(item, collidedItem) || maxOverlap > 0) ?
        maxOverlap :
        Math.max(maxOverlap, (y + h) - item.y)
    );
  }, 0);

export const moveCollidedItems = (items) => {
  let sortedItems = sort(items).slice().map((item, index) => ({ ...item, index }));
  let collidedItems = getCollidedItems(sortedItems);
  const moveCollidedItem = (collidedItem) => {
    const diffY = getDiffYToAvoidCollision(sortedItems, collidedItem);
    sortedItems[collidedItem.index].y += diffY; // eslint-disable-line no-param-reassign
  };
  while (collidedItems.length) {
    collidedItems.forEach(moveCollidedItem);
    sortedItems = moveCollidedItems(sortedItems);
    collidedItems = getCollidedItems(sortedItems);
  }
  return sortedItems.map(({ index, ...rest }) => ({ ...rest })); // eslint-disable-line no-unused-vars, max-len
};

export const tryFitToPage = (item, pageIndex) => {
  const pageStart = pageIndex * ROWS_PER_PAGE;
  const pageEnd = (pageStart + ROWS_PER_PAGE) - 1;
  return item.y <= pageEnd && (item.y + item.h <= pageEnd || item.h > ROWS_PER_PAGE - 1);
};

export const groupIntoPages = (pages = []) => (items, pageIndex = 0) => {
  const rowsOffset = (pageIndex ? ROWS_PER_PAGE : ROWS_PER_PAGE - 1) * pageIndex;
  let sortedItems = moveCollidedItems(sort(items));
  const itemsFromPreviousPage = sortedItems.filter(({ y }) => y < rowsOffset);

  itemsFromPreviousPage.forEach((itemFromPreviousPage) => {
    itemFromPreviousPage.y = rowsOffset; // eslint-disable-line no-param-reassign
  });

  const tryAddNextItemToPage = () => {
    sortedItems = moveCollidedItems(sort(sortedItems));
    return sortedItems.length && tryFitToPage(sortedItems[0], pageIndex);
  };

  const page = [];
  while (tryAddNextItemToPage()) {
    page.push(sortedItems.shift());
  }

  const result = pages.slice();

  result.push(page);

  return sortBy(
      (
      sortedItems.length ?
        groupIntoPages(result)(sortedItems, pageIndex + 1) :
        result
    ).reduce((acc, resultPage) => acc.concat(resultPage), []),
    ['y', 'x']
  );
};
