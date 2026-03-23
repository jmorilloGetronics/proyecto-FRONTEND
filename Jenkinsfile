@Library('pipeline_global@leo') _

pipelineLeo(
    stack: 'static',
    projectKey: 'proyecto-leo-frontend',
    sonarEnabled: true,
    sonarTokenCredentialId: 'sonar-token',
    staticFiles: [
        'index.html',
        'catalogo.html',
        'assets/js/catalogo.js',
        'assets/css/catalogo.css'
    ],
    sonarSources: '.',
    archiveArtifactsPattern: 'index.html,catalogo.html,assets/**,README.md'
)