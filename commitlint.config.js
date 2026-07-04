export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'revert'],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'auth', 'products', 'invoices', 'pos', 'customers', 'accounting',
        'tax', 'reports', 'ui', 'i18n', 'db', 'config', 'deps', 'security',
        'sales', 'purchase-orders', 'admin', 'spec', 'api',
      ],
    ],
    'subject-max-length': [2, 'always', 72],
  },
};
