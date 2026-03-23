@Library('pipeline_global@leo') _

pipelineLeo(
    stack: 'node',
    projectKey: 'proyecto-leo-frontend',
    sonarEnabled: true,
    sonarTokenCredentialId: 'sonar-token',
    nodeInstallCommand: '/opt/node/bin/npm install --no-audit --no-fund',
    nodeTestCommand: '/opt/node/bin/npm run test:coverage',
    sonarSources: '.',
    sonarExclusions: 'node_modules/**,coverage/**,tests/**',
    sonarLcovReportPaths: 'coverage/lcov.info',
    archiveArtifactsPattern: 'index.html,catalogo.html,assets/**,README.md'
)