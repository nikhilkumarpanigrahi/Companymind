#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  CompanyMind — AWS Deployment Script
#  Deploys to ECS Fargate using ECR for container images
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

# ── Configuration ─────────────────────────────────────────────
AWS_REGION="${AWS_REGION:-us-east-1}"
APP_NAME="companymind"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_WEB_REPO="${APP_NAME}-web"
ECR_EMBED_REPO="${APP_NAME}-embedding"
ECR_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
CLUSTER_NAME="${APP_NAME}-cluster"
WEB_SERVICE_NAME="${APP_NAME}-web-service"
EMBED_SERVICE_NAME="${APP_NAME}-embedding-service"

echo "╔══════════════════════════════════════════════════╗"
echo "║  CompanyMind AWS Deployment                      ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  Region:  ${AWS_REGION}                          "
echo "║  Account: ${ACCOUNT_ID}                          "
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── Step 1: Create ECR Repositories ──────────────────────────
echo "📦 Step 1: Creating ECR repositories..."

for repo in $ECR_WEB_REPO $ECR_EMBED_REPO; do
  aws ecr describe-repositories --repository-names "$repo" --region "$AWS_REGION" 2>/dev/null || \
    aws ecr create-repository \
      --repository-name "$repo" \
      --region "$AWS_REGION" \
      --image-scanning-configuration scanOnPush=true
done
echo "✅ ECR repositories ready"

# ── Step 2: Login to ECR ─────────────────────────────────────
echo "🔑 Step 2: Logging into ECR..."
aws ecr get-login-password --region "$AWS_REGION" | \
  docker login --username AWS --password-stdin "$ECR_URI"
echo "✅ ECR login successful"

# ── Step 3: Build & Push Docker Images ───────────────────────
echo "🐳 Step 3: Building & pushing Docker images..."

# Build web (backend + frontend)
echo "  Building web image..."
docker build -t "${ECR_WEB_REPO}:latest" .
docker tag "${ECR_WEB_REPO}:latest" "${ECR_URI}/${ECR_WEB_REPO}:latest"
docker push "${ECR_URI}/${ECR_WEB_REPO}:latest"
echo "  ✅ Web image pushed"

# Build embedding service
echo "  Building embedding image..."
docker build -t "${ECR_EMBED_REPO}:latest" ./embedding-service
docker tag "${ECR_EMBED_REPO}:latest" "${ECR_URI}/${ECR_EMBED_REPO}:latest"
docker push "${ECR_URI}/${ECR_EMBED_REPO}:latest"
echo "  ✅ Embedding image pushed"

# ── Step 4: Create ECS Cluster ───────────────────────────────
echo "🏗️  Step 4: Creating ECS cluster..."
aws ecs describe-clusters --clusters "$CLUSTER_NAME" --region "$AWS_REGION" \
  --query "clusters[?status=='ACTIVE'].clusterName" --output text | grep -q "$CLUSTER_NAME" || \
  aws ecs create-cluster --cluster-name "$CLUSTER_NAME" --region "$AWS_REGION"
echo "✅ ECS cluster ready"

# ── Step 5: Create IAM Execution Role ────────────────────────
echo "👤 Step 5: Setting up IAM execution role..."
EXEC_ROLE_NAME="ecsTaskExecutionRole"
EXEC_ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${EXEC_ROLE_NAME}"

aws iam get-role --role-name "$EXEC_ROLE_NAME" 2>/dev/null || \
  aws iam create-role \
    --role-name "$EXEC_ROLE_NAME" \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "ecs-tasks.amazonaws.com"},
        "Action": "sts:AssumeRole"
      }]
    }'

aws iam attach-role-policy \
  --role-name "$EXEC_ROLE_NAME" \
  --policy-arn "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy" 2>/dev/null || true
echo "✅ IAM role ready"

echo ""
echo "═══════════════════════════════════════════════════"
echo "  ✅ Infrastructure is ready!"
echo ""
echo "  Next steps:"
echo "  1. Create a VPC & security groups (or use defaults)"
echo "  2. Register task definitions:"
echo "     aws ecs register-task-definition --cli-input-json file://aws/task-def-embedding.json"
echo "     aws ecs register-task-definition --cli-input-json file://aws/task-def-web.json"
echo "  3. Create services:"
echo "     aws ecs create-service --cli-input-json file://aws/service-web.json"
echo "     aws ecs create-service --cli-input-json file://aws/service-embedding.json"
echo "═══════════════════════════════════════════════════"
