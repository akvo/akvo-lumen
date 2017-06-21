export const getActiveSubtitle = (pathname) => {
  let activeSubtitle;

  if (pathname.indexOf('collections') > -1) {
    activeSubtitle = 'collections';
  } else if (pathname.indexOf('activity') > -1) {
    activeSubtitle = 'activity';
  } else if (pathname.indexOf('library') > -1) {
    activeSubtitle = 'library';
  }

  return activeSubtitle;
};

export const getCollapsedStatus = (pathname) => {
  const collapsedLocations = ['visualisation/', 'dataset/', 'dashboard/', 'admin/users'];
  let collapsedStatus = false;

  collapsedLocations.forEach((location) => {
    if (pathname.indexOf(location) > -1) {
      collapsedStatus = true;
    }
  });

  return collapsedStatus;
};
