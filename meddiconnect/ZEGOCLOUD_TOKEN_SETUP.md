# ZegoCloud Token Setup Guide

## The Problem

ZegoCloud requires token-based authentication for security. Error code `50119` ("token auth err") indicates that tokens are required.

## Solution Options

### Option 1: Generate Tokens on Your Backend (Recommended for Production)

ZegoCloud requires server-side token generation for security. You need to:

1. **Install ZegoCloud token generation library on your backend**:
   - For Java/Spring Boot: Add ZegoCloud token generation SDK
   - Or use ZegoCloud's REST API to generate tokens

2. **Create a backend endpoint** to generate tokens:
   ```
   POST /api/zego/token
   Body: { roomID, userID }
   Response: { token: "..." }
   ```

3. **Update VideoCall.tsx** to fetch tokens from your backend before calling `loginRoom`

### Option 2: Use ZegoCloud's Test Token Server (Development Only)

For development/testing, you can use ZegoCloud's token server, but this is NOT recommended for production.

### Option 3: Use ZegoCloud Prebuilt UI Kit (Easier Alternative)

Consider using `zego-uikit-prebuilt-web` instead, which handles token generation automatically:
```bash
npm install zego-uikit-prebuilt-web
```

## Resources

- ZegoCloud Token Generation Docs: https://docs.zegocloud.com/article/11648
- ZegoCloud Express Engine Web SDK: https://docs.zegocloud.com/article/14921
- Token Generation Examples: https://github.com/zegocloud/zego_server_assistant

## Current Status

The code currently uses an empty token string, which will fail. You need to implement token generation before video calls will work.

