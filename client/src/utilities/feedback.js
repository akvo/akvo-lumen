/* eslint-disable no-undef, no-use-before-define, no-underscore-dangle */

let hasInited;

export const init = (state) => {
  if (!state || !state.profile || hasInited) {
    return;
  }
  hasInited = true;
  window.UsersnapCX.on('open',
    event => event.api.setValue('visitor', state.profile.sub)
  );
};

export default { init };
