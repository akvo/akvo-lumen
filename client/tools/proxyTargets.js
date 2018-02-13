export default [
  {
    source: '/api/**',
    target: 'http://backend:3000',
  },
  {
    source: '/env',
    target: 'http://backend:3000',
  },
  {
    source: '/healthz',
    target: 'http://backend:3000',
  },
  {
    source: '/maps/**',
    target: 'http://windshaft:4000',
    pathRewrite: {
      '/maps': '',
    },
  },
  {
    source: '/share/**',
    target: 'http://backend:3000',
  },
  {
    source: '/verify/**',
    target: 'http://backend:3000',
  },
];
