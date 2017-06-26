export function getItemLayout(props) {
  let output = null;

  props.canvasLayout.some((item, index) => {
    let test = false;
    if (item.i === props.item.id) {
      output = props.canvasLayout[index];
      test = true;
    }
    return test;
  });

  return output;
}

export function getIsDatasetLoaded(props) {
  if (props.item.type !== 'visualisation') {
    return false;
  }

  switch (props.item.visualisation.visualisationType) {
    case 'pivot table':
    case 'pie':
    case 'donut':
      return true;

    default:
      return Boolean(props.datasets[props.item.visualisation.datasetId].get('columns'));
  }
}

export function getArrayFromObject(object) {
  return Object.keys(object).map(key => object[key]);
}

export function getNewEntityId(entities, itemType) {
  const entityArray = getArrayFromObject(entities);
  let highestIdInt = 0;

  entityArray.forEach((item) => {
    if (item.type === itemType) {
      const idInt = parseInt(item.id.substring(itemType.length + 1), 10);
      if (idInt > highestIdInt) highestIdInt = idInt;
    }
  });

  const newIdInt = highestIdInt + 1;

  return `${itemType}-${newIdInt}`;
}

export function getFirstBlankRowGroup(layout, height) {
  /* Function to find the first collection of blank rows big enough for the
  /* default height of the entity about to be inserted. */

  /* If layout is empty, return the first row */
  if (layout.length === 0) return 0;

  const occupiedRows = {};
  let lastRow = 0;

  /* Build an object of all occupied rows, and record the last currently
  /* occupied row. */
  layout.forEach((item) => {
    for (let row = item.y; row < (item.y + item.h); row += 1) {
      occupiedRows[row] = true;
      if (row > lastRow) lastRow = row;
    }
  });

  /* Loop through every row from 0 to the last occupied. If we encounter a blank
  /* row i, check the next sequential rows until we have enough blank rows to
  /* fit our height. If we do, return row i. */
  for (let i = 0; i < lastRow; i += 1) {
    if (!occupiedRows[i]) {
      let haveSpace = true;

      for (let y = i + 1; y < (i + height); y += 1) {
        if (occupiedRows[y]) {
          haveSpace = false;
        }
      }

      if (haveSpace) {
        return i;
      }
    }
  }

  /* Otherwise, just return the row after the last currently occupied row. */
  return lastRow + 1;
}

const viewportLimits = [
  {
    limit: 720,
    name: 'small',
  },
  {
    limit: 1024,
    name: 'medium',
  },
  {
    limit: Infinity,
    name: 'large',
  },
];
export { viewportLimits };

export function getSortFunc(layout) {
  const sortFunc = (a, b) => {
    const ay = layout[a.id].y;
    const by = layout[b.id].y;
    const ax = layout[a.id].x;
    const bx = layout[b.id].x;

    if (ay < by) {
      return -1;
    } else if (ay > by) {
      return 1;
    } else if (ax < bx) {
      return -1;
    } else if (ax > bx) {
      return 1;
    }
    return 0;
  };
  return sortFunc;
}

export function formatDate(date) {
  let month = date.getMonth() + 1;
  let day = date.getDate();
  let hours = date.getHours();
  let minutes = date.getMinutes();
  if (month < 10) month = `0${month}`;
  if (day < 10) day = `0${day}`;
  if (hours < 10) hours = `0${hours}`;
  if (minutes < 10) minutes = `0${minutes}`;

  return `${date.getFullYear()}-${month}-${day} ${hours}:${minutes}`;
}

export function filterVisualisations(visualisations, filterText) {
  // NB - this naive approach is fine with a few hundred visualisations, but we should replace
  // with something more serious before users start to have thousands of visualisations
  if (!filterText) {
    return visualisations;
  }

  return visualisations.filter((visualisation) => {
    let name = visualisation.name || '';
    name = name.toString().toLowerCase();

    return name.indexOf(filterText.toString().toLowerCase()) > -1;
  });
}
