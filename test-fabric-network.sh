#!/bin/bash
# Test Fabric Lakehouse Network Connectivity

echo ""
echo "======================================================="
echo "   FABRIC LAKEHOUSE NETWORK CONNECTIVITY TEST"
echo "======================================================="
echo ""

# Read LAKEHOUSE_SERVER from .env
if [ ! -f ".env" ]; then
    echo "❌ ERROR: .env file not found"
    echo "   Please create .env from .env.example"
    exit 1
fi

SERVER=$(grep "^LAKEHOUSE_SERVER=" .env | cut -d'=' -f2 | tr -d ' "' | tr -d "'")

if [ -z "$SERVER" ]; then
    echo "❌ ERROR: LAKEHOUSE_SERVER not set in .env"
    echo "   Please add: LAKEHOUSE_SERVER=your-server.datawarehouse.fabric.microsoft.com"
    exit 1
fi

echo "🔍 Testing connection to: $SERVER"
echo "   Port: 1433 (SQL Server)"
echo ""

# Test 1: DNS Resolution
echo "1️⃣  DNS Resolution Test"
echo "─────────────────────────────────────────────────"
if nslookup "$SERVER" > /dev/null 2>&1; then
    IP=$(nslookup "$SERVER" 2>/dev/null | grep -A1 "Name:" | grep "Address:" | tail -1 | awk '{print $2}')
    echo "   ✅ DNS Resolution Success"
    echo "      Hostname: $SERVER"
    if [ -n "$IP" ]; then
        echo "      IP Address: $IP"
    fi
else
    echo "   ❌ DNS Resolution Failed"
    echo ""
    echo "   💡 Troubleshooting:"
    echo "      - Check if LAKEHOUSE_SERVER is correct"
    echo "      - Verify internet connection"
    exit 1
fi

echo ""

# Test 2: Ping (ICMP may be blocked, so failure is OK)
echo "2️⃣  Ping Test (ICMP)"
echo "─────────────────────────────────────────────────"
if timeout 3 ping -c 2 "$SERVER" > /dev/null 2>&1; then
    echo "   ✅ Ping Success (server responds to ICMP)"
else
    echo "   ⚠️  Ping Failed (this is normal - ICMP may be blocked)"
    echo "      Many Azure services block ICMP ping"
fi

echo ""

# Test 3: TCP Port 1433 Connection
echo "3️⃣  TCP Port 1433 Connection Test"
echo "─────────────────────────────────────────────────"
echo "   ⏳ Testing connection to $SERVER:1433..."

# Use timeout and nc (netcat) or telnet
if command -v nc > /dev/null 2>&1; then
    # Use netcat
    if timeout 10 nc -zv "$SERVER" 1433 2>&1 | grep -q "succeeded\|open"; then
        echo "   ✅ TCP Connection Success"
        echo "      Port 1433 is OPEN and reachable"
        echo ""
        echo "======================================================="
        echo "   🎉 ALL NETWORK TESTS PASSED"
        echo "======================================================="
        echo ""
        echo "Network connectivity is OK. If you still get errors,"
        echo "the issue may be:"
        echo "   - SQL authentication/authorization"
        echo "   - TLS/SSL handshake failure"
        echo "   - Azure Fabric permissions"
        exit 0
    else
        PORT_BLOCKED=1
    fi
elif command -v telnet > /dev/null 2>&1; then
    # Use telnet
    if timeout 10 bash -c "echo quit | telnet $SERVER 1433" 2>&1 | grep -q "Connected\|Escape"; then
        echo "   ✅ TCP Connection Success"
        echo "      Port 1433 is OPEN and reachable"
        exit 0
    else
        PORT_BLOCKED=1
    fi
else
    echo "   ⚠️  Cannot test TCP connection (nc/telnet not available)"
    echo "      Install netcat: apt-get install netcat"
    exit 1
fi

# If we get here, port 1433 is blocked
echo "   ❌ TCP Connection Failed"
echo "      Cannot connect to $SERVER:1433"
echo ""
echo "   🔥 THIS IS THE ROOT CAUSE OF YOUR 'socket hang up' ERROR"
echo ""
echo "   💡 Possible Causes:"
echo ""
echo "   1. 🛡️  FIREWALL blocking port 1433"
echo "      - Corporate firewall"
echo "      - Local firewall (Linux iptables/ufw)"
echo "      - Azure Network Security Group (NSG)"
echo ""
echo "   2. 🔒 IP NOT WHITELISTED in Azure Fabric"
echo "      - Azure Fabric restricts connections by IP"
echo "      - Your IP needs to be added to allow list"
echo ""
echo "   3. 🌐 VPN REQUIRED but not connected"
echo "      - Your organization may require VPN"
echo "      - Connect to corporate VPN and try again"
echo ""
echo "   4. ❌ SQL ENDPOINT NOT ENABLED"
echo "      - Verify SQL Analytics Endpoint is enabled"
echo "      - Check Lakehouse status in Azure Fabric"
echo ""
echo "   🛠️  Recommended Actions:"
echo ""
echo "   a) Check your public IP:"
echo "      curl ifconfig.me"
echo ""
MY_IP=$(curl -s --max-time 5 ifconfig.me 2>/dev/null || echo "Unable to detect")
echo "      Your current IP: $MY_IP"
echo ""
echo "   b) Contact Azure Fabric administrator to:"
echo "      - Whitelist your IP: $MY_IP"
echo "      - Verify SQL endpoint is enabled"
echo "      - Check workspace firewall rules"
echo ""
echo "   c) Try connecting from Azure Cloud Shell:"
echo "      https://shell.azure.com"
echo "      This tests if the issue is your local network"
echo ""
echo "   d) Check if VPN is required:"
echo "      Ask your IT team if VPN is needed for Azure Fabric"
echo ""

exit 1
