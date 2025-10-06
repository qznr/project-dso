pipeline {
    agent any

    environment {
        DEPLOY_HOST = '10.34.100.157'
        DEPLOY_USER = 'dso504'
    }

    triggers {
        pollSCM('H/1 * * * *')
    }

    stages {
        stage('Prepare') {
            steps {
                echo "📦 Using code checked out by Jenkins"
                sh 'ls -la'  // confirm files exist
            }
        }

        stage('Build & Test') {
            steps {
                sh 'echo "✅ Code fetched successfully — running tests (if any)..."'
            }
        }

        stage('Deploy to Docker VPS') {
            steps {
                echo "🚀 Deploying to Docker VPS..."
                sshagent (credentials: ['DSO4-ssh']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no $DEPLOY_USER@$DEPLOY_HOST << 'EOF'
                          set -e
                          echo "🔄 Pulling latest code on remote..."
                          cd /srv/project-dso || exit 1
                          git pull origin main

                          echo "🐳 Rebuilding and starting containers..."
                          docker compose pull
                          docker compose up -d --build

                          echo "🧹 Cleaning up unused images..."
                          docker system prune -f

                          echo "✅ Deployment complete!"
                        EOF
                    '''
                }
            }
        }
    }

    post {
        success {
            echo '✅ Deployment successful!'
        }
        failure {
            echo '❌ Deployment failed!'
        }
    }
}