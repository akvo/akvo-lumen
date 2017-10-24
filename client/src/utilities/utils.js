export function isValidEmail(email) {
  const regex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,9})+$/;
  return regex.test(email);
}

// Returns undefined if the object or any given nested key doesn't exist
export function checkUndefined(object, ...keys) {
  if (!object || typeof object !== 'object') {
    return undefined;
  }

  if (keys.length === 0) {
    return object;
  }

  let currentObject = object;

  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];

    if (!currentObject[key]) {
      return undefined;
    }

    currentObject = currentObject[key];
  }

  return currentObject;
}
