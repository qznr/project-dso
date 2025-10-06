pipeline {
    agent any

    environment {
        GITHUB_TOKEN = credentials('DSO4')
        DEPLOY_HOST = '10.34.100.157'
        DEPLOY_USER = 'dso504'
    }

    triggers {
        pollSCM('H/1 * * * *')
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: "https://${GITHUB_TOKEN}@github.com/qznr/project-dso.git"
            }
        }

        stage('Build & Test') {
            steps {
                sh 'echo "✅ Code fetched, running tests (if any)..."'
            }
        }

        stage('Deploy') {
            steps {
                sshagent (credentials: ['jenkins_ssh_key']) {
                    sh '''
                    ssh -o StrictHostKeyChecking=no $DEPLOY_USER@$DEPLOY_HOST << 'EOF'
                      cd /path/to/your/project
                      echo "Pulling latest code..."
                      git pull origin main
                      echo "Rebuilding containers..."
                      docker compose pull
                      docker compose up -d --build
                      docker system prune -f
                    EOF
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'Deployment successful!'
        }
        failure {
            echo 'Deployment failed.'
        }
    }
}
