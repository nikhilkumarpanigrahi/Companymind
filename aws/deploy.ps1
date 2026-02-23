# ═══════════════════════════════════════════════════════════════
#  CompanyMind — AWS Deployment Script (PowerShell)
#  Deploys to ECS Fargate using ECR for container images
# ═══════════════════════════════════════════════════════════════
$ErrorActionPreference = "Stop"

# ── Configuration ─────────────────────────────────────────────
$AWS_REGION = if ($env:AWS_REGION) { $env:AWS_REGION } else { "us-east-1" }
$APP_NAME = "companymind"
$ACCOUNT_ID = (aws sts get-caller-identity --query Account --output text).Trim()
$ECR_WEB_REPO = "$APP_NAME-web"
$ECR_EMBED_REPO = "$APP_NAME-embedding"
$ECR_URI = "$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
$CLUSTER_NAME = "$APP_NAME-cluster"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CompanyMind AWS Deployment" -ForegroundColor Cyan
Write-Host "  Region:  $AWS_REGION" -ForegroundColor Cyan
Write-Host "  Account: $ACCOUNT_ID" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Create ECR Repositories ──────────────────────────
Write-Host "[1/6] Creating ECR repositories..." -ForegroundColor Yellow
foreach ($repo in @($ECR_WEB_REPO, $ECR_EMBED_REPO)) {
    try {
        aws ecr describe-repositories --repository-names $repo --region $AWS_REGION 2>$null | Out-Null
        Write-Host "  Repository '$repo' already exists"
    } catch {
        aws ecr create-repository `
            --repository-name $repo `
            --region $AWS_REGION `
            --image-scanning-configuration scanOnPush=true | Out-Null
        Write-Host "  Created repository '$repo'"
    }
}
Write-Host "  [OK] ECR repositories ready" -ForegroundColor Green

# ── Step 2: Login to ECR ─────────────────────────────────────
Write-Host "[2/6] Logging into ECR..." -ForegroundColor Yellow
$password = aws ecr get-login-password --region $AWS_REGION
$password | docker login --username AWS --password-stdin "$ECR_URI"
Write-Host "  [OK] ECR login successful" -ForegroundColor Green

# ── Step 3: Build & Push Web Image ───────────────────────────
Write-Host "[3/6] Building web image (backend + frontend)..." -ForegroundColor Yellow
docker build -t "${ECR_WEB_REPO}:latest" .
docker tag "${ECR_WEB_REPO}:latest" "${ECR_URI}/${ECR_WEB_REPO}:latest"
docker push "${ECR_URI}/${ECR_WEB_REPO}:latest"
Write-Host "  [OK] Web image pushed to ECR" -ForegroundColor Green

# ── Step 4: Build & Push Embedding Image ─────────────────────
Write-Host "[4/6] Building embedding image..." -ForegroundColor Yellow
docker build -t "${ECR_EMBED_REPO}:latest" ./embedding-service
docker tag "${ECR_EMBED_REPO}:latest" "${ECR_URI}/${ECR_EMBED_REPO}:latest"
docker push "${ECR_URI}/${ECR_EMBED_REPO}:latest"
Write-Host "  [OK] Embedding image pushed to ECR" -ForegroundColor Green

# ── Step 5: Create ECS Cluster ───────────────────────────────
Write-Host "[5/6] Creating ECS cluster..." -ForegroundColor Yellow
$existingCluster = aws ecs describe-clusters --clusters $CLUSTER_NAME --region $AWS_REGION `
    --query "clusters[?status=='ACTIVE'].clusterName" --output text 2>$null
if ($existingCluster -ne $CLUSTER_NAME) {
    aws ecs create-cluster --cluster-name $CLUSTER_NAME --region $AWS_REGION | Out-Null
    Write-Host "  Created cluster '$CLUSTER_NAME'"
} else {
    Write-Host "  Cluster '$CLUSTER_NAME' already exists"
}
Write-Host "  [OK] ECS cluster ready" -ForegroundColor Green

# ── Step 6: Update task definitions with actual account ID ───
Write-Host "[6/6] Preparing task definitions..." -ForegroundColor Yellow

# Read and replace placeholders in task definitions
$webTaskDef = (Get-Content "aws/task-def-web.json" -Raw) -replace "ACCOUNT_ID", $ACCOUNT_ID
$embedTaskDef = (Get-Content "aws/task-def-embedding.json" -Raw) -replace "ACCOUNT_ID", $ACCOUNT_ID

# Write temp files
$webTaskDef | Out-File "aws/task-def-web-resolved.json" -Encoding UTF8
$embedTaskDef | Out-File "aws/task-def-embedding-resolved.json" -Encoding UTF8

# Register task definitions
aws ecs register-task-definition --cli-input-json "file://aws/task-def-embedding-resolved.json" --region $AWS_REGION | Out-Null
Write-Host "  Registered embedding task definition"

aws ecs register-task-definition --cli-input-json "file://aws/task-def-web-resolved.json" --region $AWS_REGION | Out-Null
Write-Host "  Registered web task definition"

Write-Host "  [OK] Task definitions registered" -ForegroundColor Green

# ── Done ─────────────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Images pushed to ECR, cluster created," -ForegroundColor White
Write-Host "  and task definitions registered." -ForegroundColor White
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor Yellow
Write-Host "  1. Create ECS services (or use AWS Console):" -ForegroundColor White
Write-Host "     - Go to ECS -> $CLUSTER_NAME -> Create Service" -ForegroundColor Gray
Write-Host "     - Select Fargate, choose the task definition" -ForegroundColor Gray
Write-Host "     - Assign a public subnet and security group" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Add an ALB (Application Load Balancer) for" -ForegroundColor White
Write-Host "     HTTPS and a custom domain" -ForegroundColor White
Write-Host ""
Write-Host "  3. Whitelist the ECS task's public IP in MongoDB Atlas" -ForegroundColor White
Write-Host ""
