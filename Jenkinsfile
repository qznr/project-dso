pipeline {
    agent any

    environment {
        DEPLOY_HOST = '10.34.100.157'
        DEPLOY_USER = 'dso504'
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
    }

    stages {
        stage('Prepare') {
            steps {
                echo "Using code checked out by Jenkins"
                checkout scm
                sh 'ls -la'
            }
        }

        stage('Build & Test') {
            steps {
                echo "Code fetched successfully — running tests (if any)..."
                // Add test commands here if needed, e.g.:
                // sh 'npm test' or 'mvn test'
            }
        }

        stage('Deploy to Docker VPS') {
            environment {
                GH_PAT = credentials('DSO4-PAT')
            }
            steps {
                echo "Deploying to Docker VPS..."
                sshagent (credentials: ['DSO4-ssh']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} '
                            set -e &&
                            TARGET_DIR="/home/dso504/project-dso" &&
                            REPO_URL="https://dso504:${GH_PAT}@github.com/qznr/project-dso.git" &&

                            echo "Checking and pulling/cloning code on remote..." &&
                            mkdir -p "$TARGET_DIR" &&
                            cd "$TARGET_DIR" &&

                            if [ -d .git ]; then
                                echo "Repository already exists, pulling latest changes..."
                                git config remote.origin.url "$REPO_URL"
                                git pull origin main
                            else
                                echo "Repository not found, cloning from scratch..."
                                git clone "$REPO_URL" .
                            fi &&

                            echo "Rebuilding and starting containers..." &&
                            docker compose pull &&
                            docker compose up -d --build &&

                            echo "Cleaning up unused images..." &&
                            docker system prune -f &&

                            echo "Deployment complete!"
                        '
                    """
                }
            }
        }
    }

    post {
        success {
            echo 'Deployment successful!'
        }
        failure {
            echo 'Deployment failed!'
        }
        always {
            echo "Pipeline finished with result: ${currentBuild.currentResult}"
        }
    }
}
