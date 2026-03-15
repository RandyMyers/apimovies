/**
 * Parse userAgent to infer device type (mobile, tablet, desktop)
 */
function parseDeviceType(userAgent) {
  if (!userAgent || typeof userAgent !== 'string') return 'desktop';
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua) && !/ipad|tablet/i.test(ua)) {
    return 'mobile';
  }
  if (/ipad|tablet|playbook|silk/i.test(ua)) {
    return 'tablet';
  }
  return 'desktop';
}

module.exports = { parseDeviceType };
