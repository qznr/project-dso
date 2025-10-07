node {
    def DEPLOY_HOST = '10.34.100.157'
    def DEPLOY_USER = 'dso504'

    currentBuild.result = 'SUCCESS'

    try {
        stage('Prepare') {
            echo "📦 Using code checked out by Jenkins"
            checkout scm
            sh 'ls -la'
        }

        stage('Build & Test') {
            echo "Code fetched successfully — running tests (if any)..."
        }

        stage('Deploy to Docker VPS') {
            echo "Deploying to Docker VPS..."
            sshagent (credentials: ['DSO4-ssh']) {
                sh """
                    ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} << 'EOF'
                      set -e
                      echo "Pulling latest code on remote..."
                      cd /home/dso504/project-dso || exit 1
                      git pull origin main

                      echo "Rebuilding and starting containers..."
                      docker compose pull
                      docker compose up -d --build

                      echo "Cleaning up unused images..."
                      docker system prune -f

                      echo "Deployment complete!"
                    EOF
                """
            }
        }
    } catch (err) {
        currentBuild.result = 'FAILURE'
        echo "Pipeline failed: ${err.getMessage()}"
        throw err
    } finally {
        if (currentBuild.result == 'SUCCESS') {
            echo 'Deployment successful!'
        } else {
            echo 'Deployment failed!'
        }
    }
}