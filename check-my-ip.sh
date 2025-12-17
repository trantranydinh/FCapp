#!/bin/bash
# Check your public IP and generate email template for admin

echo ""
echo "======================================================="
echo "   CHECKING YOUR PUBLIC IP ADDRESS"
echo "======================================================="
echo ""

echo "🔍 Detecting your public IP..."
MY_IP=$(curl -s --max-time 10 ifconfig.me 2>/dev/null)

if [ -z "$MY_IP" ]; then
    echo "❌ Failed to detect IP. Trying alternative service..."
    MY_IP=$(curl -s --max-time 10 api.ipify.org 2>/dev/null)
fi

if [ -z "$MY_IP" ]; then
    echo "❌ Failed to detect IP. Trying another service..."
    MY_IP=$(curl -s --max-time 10 icanhazip.com 2>/dev/null)
fi

if [ -z "$MY_IP" ]; then
    echo "❌ ERROR: Cannot detect public IP"
    echo "   Please check your internet connection"
    exit 1
fi

echo "✅ Your public IP address: $MY_IP"
echo ""

# Read Lakehouse info from .env
SERVER=""
DATABASE=""
if [ -f ".env" ]; then
    SERVER=$(grep "^LAKEHOUSE_SERVER=" .env 2>/dev/null | cut -d'=' -f2 | tr -d ' "'"'"'')
    DATABASE=$(grep "^LAKEHOUSE_DATABASE=" .env 2>/dev/null | cut -d'=' -f2 | tr -d ' "'"'"'')
fi

echo "======================================================="
echo "   EMAIL TEMPLATE FOR AZURE FABRIC ADMIN"
echo "======================================================="
echo ""
echo "Copy the text below and send to your Azure Fabric administrator:"
echo ""
echo "─────────────────────────────────────────────────────"
cat << EOF

Subject: Request to Whitelist IP for Fabric Lakehouse SQL Access

Hi [Admin Name],

I am trying to connect to our Fabric Lakehouse from my development machine
but encountering "socket hang up" errors when connecting to port 1433 (SQL endpoint).

Authentication is working correctly (I can successfully login with device code),
but the SQL connection is being blocked after authentication completes.

Could you please help with the following:

1. ✅ Whitelist my IP address for SQL endpoint access:
   IP: $MY_IP

2. ✅ Verify SQL Analytics Endpoint is enabled and running

3. ✅ Check workspace firewall rules allow port 1433 from my IP

Connection Details:
• My Email: Trang.Nguyen@intersnack.com.vn
• My Public IP: $MY_IP
EOF

if [ -n "$SERVER" ]; then
    echo "• Lakehouse Server: $SERVER"
fi
if [ -n "$DATABASE" ]; then
    echo "• Database: $DATABASE"
fi

cat << 'EOF'

Error Details:
• Authentication: ✅ Success (device code flow works)
• SQL Connection: ❌ "Connection lost - socket hang up"
• This indicates firewall/IP restriction on port 1433

I need access to develop and test our Cashew Forecast System integration
with the Lakehouse data.

Please let me know once the IP has been whitelisted so I can test the connection.

Thank you for your assistance!

Best regards,
Trang Nguyen

EOF

echo "─────────────────────────────────────────────────────"
echo ""
echo "📧 NEXT STEPS:"
echo ""
echo "1. Copy the email template above"
echo "2. Send it to your Azure Fabric workspace administrator"
echo "3. Replace [Admin Name] with actual admin name"
echo "4. Wait for confirmation that IP is whitelisted"
echo "5. Once whitelisted, test with: node backend/debug-fabric.js"
echo ""
echo "⏱️  Typical response time: 1-24 hours (depending on admin availability)"
echo ""
echo "🚀 ALTERNATIVE (If urgent):"
echo "   - Ask admin to add you to workspace with proper role"
echo "   - Or deploy backend to Azure VM/App Service (no IP restriction needed)"
echo ""
