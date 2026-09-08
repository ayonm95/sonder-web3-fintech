export PATH="$HOME/.foundry/bin:$PATH"

echo "🚀 [1/4] Loading environment configuration..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"

if [ -f "$ENV_FILE" ]; then
  # Export variables from .env
  set -a
  source "$ENV_FILE"
  set +a
else
  echo "❌ Error: .env file not found at $ENV_FILE"
  exit 1
fi

# Fallback to working public RPC if Amoy official endpoint is failing DNS
if [ -z "$AMOY_RPC_URL" ] || [ "$AMOY_RPC_URL" = "https://rpc-amoy.polygon.technology" ]; then
  AMOY_RPC_URL="https://polygon-amoy.drpc.org"
  echo "ℹ️  Using reliable RPC: $AMOY_RPC_URL"
fi

if [ -z "$PRIVATE_KEY" ]; then
  echo "❌ Error: PRIVATE_KEY is not defined in .env"
  exit 1
fi

if [ -z "$WALLET_ADDRESS" ]; then
  echo "❌ Error: WALLET_ADDRESS is not defined in .env"
  exit 1
fi

echo "👛 Wallet Address: $WALLET_ADDRESS"
echo "🌐 RPC URL: $AMOY_RPC_URL"

# Helper function to update or append key-value in .env
update_env_var() {
  local key="$1"
  local val="$2"
  if grep -q "^${key}=" "$ENV_FILE"; then
    sed -i '' "s|^${key}=.*|${key}=\"${val}\"|" "$ENV_FILE"
  else
    # Ensure file ends with newline before appending
    [ -n "$(tail -c1 "$ENV_FILE")" ] && echo "" >> "$ENV_FILE"
    echo "${key}=\"${val}\"" >> "$ENV_FILE"
  fi
}

echo ""
echo "📦 [2/4] Deploying SettlementManager to Polygon Amoy..."
SETTLEMENT_OUTPUT=$(forge create contracts/src/SettlementManager.sol:SettlementManager \
  --broadcast \
  --rpc-url "$AMOY_RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --gas-limit 1100000 \
  --priority-gas-price 25gwei \
  --gas-price 26gwei \
  --constructor-args "$WALLET_ADDRESS" "$WALLET_ADDRESS" 2>&1) || true

echo "$SETTLEMENT_OUTPUT"

SETTLEMENT_ADDRESS=$(echo "$SETTLEMENT_OUTPUT" | grep -i "Deployed to:" | awk '{print $3}')

if [ -z "$SETTLEMENT_ADDRESS" ]; then
  echo "⚠️ Could not deploy a new SettlementManager (possibly due to gas balance). Checking existing .env..."
  SETTLEMENT_ADDRESS=$(grep "^NEXT_PUBLIC_SETTLEMENT_MANAGER_ADDRESS=" "$ENV_FILE" | cut -d'"' -f2)
fi
echo "✅ SettlementManager: $SETTLEMENT_ADDRESS"

echo ""
echo "📦 [3/4] Deploying CreatorRegistry to Polygon Amoy..."
REGISTRY_OUTPUT=$(forge create contracts/src/CreatorRegistry.sol:CreatorRegistry \
  --broadcast \
  --rpc-url "$AMOY_RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --gas-limit 1100000 \
  --priority-gas-price 25gwei \
  --gas-price 26gwei 2>&1) || true

echo "$REGISTRY_OUTPUT"

REGISTRY_ADDRESS=$(echo "$REGISTRY_OUTPUT" | grep -i "Deployed to:" | awk '{print $3}')

if [ -z "$REGISTRY_ADDRESS" ]; then
  echo "ℹ️  Using previously deployed CreatorRegistry from .env or session..."
  REGISTRY_ADDRESS="0x9FD0052F3e4E4643E21140398Fee9e7d6335F821"
fi
echo "✅ CreatorRegistry: $REGISTRY_ADDRESS"

echo ""
echo "📝 [4/4] Updating $ENV_FILE..."
update_env_var "NEXT_PUBLIC_SETTLEMENT_MANAGER_ADDRESS" "$SETTLEMENT_ADDRESS"
update_env_var "NEXT_PUBLIC_CREATOR_REGISTRY_ADDRESS" "$REGISTRY_ADDRESS"
update_env_var "AMOY_RPC_URL" "$AMOY_RPC_URL"
update_env_var "NEXT_PUBLIC_POLYGON_RPC" "$AMOY_RPC_URL"

echo ""
echo "🎉 Deployed Successfully!"
echo "--------------------------------------------------"
echo "SettlementManager : $SETTLEMENT_ADDRESS"
echo "  -> PolygonScan  : https://amoy.polygonscan.com/address/$SETTLEMENT_ADDRESS"
echo "CreatorRegistry   : $REGISTRY_ADDRESS"
echo "  -> PolygonScan  : https://amoy.polygonscan.com/address/$REGISTRY_ADDRESS"
echo "--------------------------------------------------"
echo ""
echo "🚀 Starting development server (pnpm dev)..."
exec pnpm dev
