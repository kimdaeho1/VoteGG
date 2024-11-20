// client/src/utils/mediasoupClientHelpers.js
import * as mediasoupClient from 'mediasoup-client';

// 디바이스 생성
export const createDevice = async (routerRtpCapabilities) => {
  try {
    const device = new mediasoupClient.Device();
    await device.load({ routerRtpCapabilities });
    return device;
  } catch (error) {
    console.error('Failed to create device:', error);
    throw error;
  }
};

// WebRTC 전송 생성
export const createTransport = async (device, params) => {
  try {
    return device.createSendTransport(params);
  } catch (error) {
    console.error('Failed to create transport:', error);
    throw error;
  }
};
