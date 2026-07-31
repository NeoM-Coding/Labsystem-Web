pipeline {
    agent any

    parameters {
        string(
            name: 'GIT_BRANCH',
            defaultValue: 'main',
            description: '要构建的远程分支，例如 main、develop 或 feature/demo'
        )
        string(
            name: 'GITHUB_SHA',
            defaultValue: '',
            description: '可选：指定提交 SHA；填写后优先于 GIT_BRANCH'
        )
        booleanParam(
            name: 'DEPLOY_AFTER_BUILD',
            defaultValue: true,
            description: '成功构建后通过受限宿主机 webhook 重建前端镜像与容器'
        )
    }

    options {
        skipDefaultCheckout(true)
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '30'))
    }

    stages {
        stage('Checkout') {
            steps {
                script {
                    def commitSha = params.GITHUB_SHA.trim()
                    def branchName = params.GIT_BRANCH.trim().replaceFirst('^origin/', '')

                    if (commitSha && !(commitSha ==~ /[0-9a-fA-F]{7,40}/)) {
                        error('GITHUB_SHA 必须是 7 到 40 位十六进制提交 SHA')
                    }
                    if (!commitSha) {
                        withEnv(["REQUESTED_BRANCH=${branchName}"]) {
                            sh 'git check-ref-format --branch "$REQUESTED_BRANCH"'
                        }
                    }

                    checkout([
                        $class: 'GitSCM',
                        branches: [[name: commitSha ?: "*/${branchName}"]],
                        userRemoteConfigs: [[
                            url: env.WEB_REPOSITORY_URL,
                            credentialsId: 'lab-system-web-deploy-key',
                            refspec: '+refs/heads/*:refs/remotes/origin/*'
                        ]]
                    ])
                }
                sh 'echo "Building commit $(git rev-parse HEAD)"'
            }
        }

        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Quality') {
            parallel {
                stage('Lint') {
                    steps {
                        sh 'npm run lint'
                    }
                }
                stage('Test') {
                    steps {
                        sh 'npm test'
                    }
                }
                stage('Typecheck') {
                    steps {
                        sh 'npm run typecheck'
                    }
                }
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Publish deploy artifact') {
            when {
                expression { params.DEPLOY_AFTER_BUILD }
            }
            steps {
                sh '''
                  set -eu
                  commit_sha="$(git rev-parse HEAD)"
                  artifact_root="/var/lib/lab-system-deploy/artifacts/web"
                  staging_dir="$artifact_root/.${commit_sha}.tmp"
                  release_dir="$artifact_root/$commit_sha"

                  rm -rf "$staging_dir"
                  mkdir -p "$staging_dir/dist"
                  cp -R dist/. "$staging_dir/dist/"
                  cp docker/nginx.conf "$staging_dir/nginx.conf"
                  printf '%s\n' "$commit_sha" > "$staging_dir/commit"
                  rm -rf "$release_dir"
                  mv "$staging_dir" "$release_dir"
                '''
            }
        }

        stage('Deploy') {
            when {
                expression { params.DEPLOY_AFTER_BUILD }
            }
            steps {
                sh '''
                  test -n "$LAB_DEPLOY_WEBHOOK_URL"
                  test -r "$LAB_DEPLOY_WEBHOOK_TOKEN_FILE"
                  set +x
                  commit_sha="$(git rev-parse HEAD)"
                  printf '{"commit":"%s"}' "$commit_sha" | curl --fail-with-body --show-error --silent \
                    --header "Authorization: Bearer $(cat "$LAB_DEPLOY_WEBHOOK_TOKEN_FILE")" \
                    --header "Content-Type: application/json" \
                    --data-binary @- \
                    "${LAB_DEPLOY_WEBHOOK_URL%/}/v1/deploy/web"
                '''
            }
        }
    }

    post {
        success {
            archiveArtifacts artifacts: 'dist/**', fingerprint: true
        }
    }
}
