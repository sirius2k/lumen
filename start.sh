#!/bin/bash
set -e

ENV_FILE=".env.production"
COMPOSE_FILE="docker-compose.prod.yml"

# ── 색상 ──
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${GREEN}◈ Lumen — Your Personal Knowledge Hub${NC}"
echo ""

# ── .env.production 파일 확인 ──
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}[ERROR]${NC} ${ENV_FILE} 파일이 없습니다."
  echo -e "${YELLOW}  → .env.production.example을 복사하여 생성하세요:${NC}"
  echo ""
  echo "    cp .env.production.example .env.production"
  echo "    # 값을 수정한 후 다시 실행하세요"
  echo ""
  exit 1
fi

# ── 필수 환경 변수 검증 ──
source "$ENV_FILE"
MISSING=()
[ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "change-me-to-a-strong-random-string" ] && MISSING+=("JWT_SECRET")
[ -z "$JWT_REFRESH_SECRET" ] || [ "$JWT_REFRESH_SECRET" = "change-me-to-another-strong-random-string" ] && MISSING+=("JWT_REFRESH_SECRET")
[ -z "$ANTHROPIC_API_KEY" ] || [[ "$ANTHROPIC_API_KEY" == sk-ant-... ]] && MISSING+=("ANTHROPIC_API_KEY")
[ -z "$OPENAI_API_KEY" ] || [[ "$OPENAI_API_KEY" == sk-... ]] && MISSING+=("OPENAI_API_KEY")

if [ ${#MISSING[@]} -gt 0 ]; then
  echo -e "${RED}[ERROR]${NC} 다음 환경 변수를 .env.production에 설정하세요:"
  for var in "${MISSING[@]}"; do
    echo -e "  ${YELLOW}→ ${var}${NC}"
  done
  echo ""
  exit 1
fi

# ── Docker 실행 확인 ──
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}[ERROR]${NC} Docker가 실행 중이 아닙니다. Docker Desktop을 시작하세요."
  exit 1
fi

# ── 빌드 & 시작 ──
echo -e "${YELLOW}[1/3]${NC} 이미지 빌드 중..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build

echo -e "${YELLOW}[2/3]${NC} 컨테이너 시작 중..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

echo -e "${YELLOW}[3/3]${NC} DB 마이그레이션 실행 중..."
docker compose -f "$COMPOSE_FILE" exec api npx prisma migrate deploy --schema=./prisma/schema.prisma

echo ""
echo -e "${GREEN}✔ Lumen이 시작되었습니다!${NC}"
echo ""
echo "  Web:  http://localhost:3050"
echo "  API:  http://localhost:3051/api"
echo ""
echo -e "${YELLOW}Docker Desktop에서 'lumen' 프로젝트로 컨테이너를 관리할 수 있습니다.${NC}"
echo ""
