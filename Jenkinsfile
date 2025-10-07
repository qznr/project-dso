node {
    def DEPLOY_HOST = '10.34.100.157'
    def DEPLOY_USER = 'dso504'

    currentBuild.result = 'SUCCESS'

    try {
        stage('Prepare') {
            echo "Using code checked out by Jenkins"
            checkout scm
            sh 'ls -la'
        }

        stage('Build & Test') {
            echo "Code fetched successfully — running tests (if any)..."
        }

        stage('Deploy to Docker VPS') {
            echo "Deploying to Docker VPS..."
            withCredentials([string(credentialsId: 'DSO4-PAT', variable: 'GH_PAT')]) {
                sshagent (credentials: ['DSO4-ssh']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} << 'EOF'
                          set -e
                          TARGET_DIR="/home/dso504/project-dso"
                          REPO_URL="https://x-oauth-basic:\${GH_PAT}@github.com/qznr/project-dso.git"

                          echo "Checking and pulling/cloning code on remote..."
                          mkdir -p "\${TARGET_DIR}"
                          cd "\${TARGET_DIR}" || exit 1

                          if [ -d .git ]; then
                            echo "Repository already exists, pulling latest changes..."
                            git config remote.origin.url "\${REPO_URL}"
                            git pull origin main
                          else
                            echo "Repository not found, cloning from scratch..."
                            git clone "\${REPO_URL}" .
                          fi

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