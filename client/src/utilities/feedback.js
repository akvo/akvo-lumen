/* eslint-disable no-undef, no-use-before-define, no-underscore-dangle */

let feedbackInited;

export const init =  (state) => {
    if (feedbackInited) {
        return;
    }
    feedbackInited = true;
    const b = document.createElement('script');
    b.setAttribute('data-bugyard', '5e65daa3f74c520014b05cfa');
    b.setAttribute('async', 'async');
    b.setAttribute('defer', 'defer');
    b.setAttribute('src', 'https://widget.bugyard.io/bugyard.min.js');
    document.getElementsByTagName('head')[0].appendChild(b);
};