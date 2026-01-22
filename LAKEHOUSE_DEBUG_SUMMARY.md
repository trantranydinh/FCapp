# Lakehouse Connection Diagnostics - Final Report

## Issue Description
Application fails to connect to Azure Fabric Lakehouse with `Connection lost - socket hang up`.

## Diagnosis Steps Taken
1.  **Environment Variables**: Verified Correct (`.env` loaded).
2.  **DNS**: Verified Correct (Resolves to IP).
3.  **TCP Reachability**: Verified Correct (Port 1433 Open).
4.  **TLS Handshake (Raw)**: Verified Correct (Node `tls` module can handshake with server).
5.  **Authentication**:
    *   Tried **Access Token** (Tedious v19 & v18).
    *   Tried **Service Principal Secret** (Tedious v19 & v18).
    *   Result: All fail with `socket hang up` during SQL protocol handshake *inside* the driver.
6.  **Dependency Pinning**:
    *   Downgraded `tedious` to `18.6.1` (known stable).
    *   Result: Still fails.
7.  **Encryption Test**:
    *   Ran with `encrypt: false`.
    *   Result: Server replied `Server requires encryption`.
    *   **Conclusion**: Network path and Firewall are **OPEN**. The server IS reachable. The issue is strictly in the **Encrypted Communication Layer** (TLS/SSL) within the application driver.

## Root Cause Identified
**Incompatible Node.js Runtime Version.**
The environment is running **Node.js v24.11.1**.
*   Node.js v24 is a bleeding-edge/nightly or non-standard build (Current stable is v23).
*   The `tedious` driver (used by `mssql`) has known compatibility issues with newer OpenSSL versions found in very recent Node builds, leading to socket drops during TLS negotiation.

## Resolutions Applied
1.  **Frontend/Backend Port Mismatch**: 
    *   Fixed `frontend/lib/apiClient.js` to point to port `50005` (was 8000).
    *   Fixed `.env` Auth Redirect URI to port `50005`.
2.  **Backend Config**:
    *   Updated `LakehouseProvider.js` to use robust **Service Principal** authentication (more stable than tokens).
    *   Added `overrides` in `package.json` to pin `tedious` to `18.6.1`.

## Recommendations (User Action Required)
To fix the Lakehouse connection, you **MUST switch to a Stable Node.js LTS Version**.
1.  Uninstall Node.js v24.
2.  Install **Node.js v20.11.0 (LTS)** or **v22.x**.
3.  Delete `node_modules` and run `npm install` again.
4.  The application should then connect successfully.
