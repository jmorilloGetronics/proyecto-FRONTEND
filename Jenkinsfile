pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Validate static files') {
            steps {
                script {
                    if (isUnix()) {
                        sh '''
                            test -f index.html
                            test -f catalogo.html
                            test -f assets/js/catalogo.js
                            test -f assets/css/catalogo.css
                        '''
                    } else {
                        bat '''
                            if not exist index.html exit /b 1
                            if not exist catalogo.html exit /b 1
                            if not exist assets\\js\\catalogo.js exit /b 1
                            if not exist assets\\css\\catalogo.css exit /b 1
                        '''
                    }
                }
            }
        }

        stage('SonarQube (optional)') {
            when {
                allOf {
                    expression { env.SONAR_SCANNER_HOME?.trim() }
                    expression { env.SONAR_HOST_URL?.trim() }
                    expression { env.SONAR_TOKEN?.trim() }
                }
            }
            steps {
                script {
                    if (isUnix()) {
                        sh '$SONAR_SCANNER_HOME/bin/sonar-scanner -Dsonar.projectKey=proyecto-leo-frontend -Dsonar.sources=. -Dsonar.host.url=$SONAR_HOST_URL -Dsonar.token=$SONAR_TOKEN'
                    } else {
                        bat '%SONAR_SCANNER_HOME%\\bin\\sonar-scanner.bat -Dsonar.projectKey=proyecto-leo-frontend -Dsonar.sources=. -Dsonar.host.url=%SONAR_HOST_URL% -Dsonar.token=%SONAR_TOKEN%'
                    }
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'index.html,catalogo.html,assets/**,README.md', allowEmptyArchive: false, fingerprint: true
        }
    }
}