module.exports = {
  ...require('@codingame/semantic-release-config'),
  branches: [
    'main'
  ],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/npm',
    '@semantic-release/github'
  ]
}