export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      ['engine', 'ui', 'game', 'data', 'service', 'styles', 'build', 'ci', 'deps', 'skills', 'docs', 'repo', 'e2e'],
    ],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [0],
    'footer-max-line-length': [0],
  },
};
