/**
 * ZegoCloud Configuration
 * 
 * To get your ZegoCloud credentials:
 * 1. Sign up at https://console.zegocloud.com/
 * 2. Create a new project
 * 3. Get your AppID and AppSign from the project dashboard
 * 4. Replace the values below
 * 
 * IMPORTANT: In production, store these in environment variables for security
 */

export const ZEGO_CONFIG = {
  // ZegoCloud AppID from console.zegocloud.com
  appID: 1103025272, // Your ZegoCloud AppID
  
  // ZegoCloud ServerSecret from console.zegocloud.com
  // NOTE: For Prebuilt UI Kit, you need ServerSecret (not AppSign)
  // Get it from: Console > Your Project > Basic Configurations > ServerSecret
  serverSecret: '4494bf95f858d1d563e7b75d06a57027',
  
  // Server URL - use the default ZegoCloud server
  server: 'wss://webliveroom-test.zego.im/ws', // Test server (default)
};

