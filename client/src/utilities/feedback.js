/* eslint-disable no-undef, no-use-before-define, no-underscore-dangle */

let hasInited;

export const init = (state) => {
  if (!state || !state.profile || hasInited) {
    return;
  }
  hasInited = true;
  console.log('set event!', state.profile.sub);
  window.UsersnapCX.on('open', function(event) {
    event.api.setValue('visitor', state.profile.sub);
  });
};

export default { init };
