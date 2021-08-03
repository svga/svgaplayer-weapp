declare const my: WechatMiniprogram.Wx;
export function getMiniBridge (): WechatMiniprogram.Wx {
  if (typeof wx === 'undefined' && typeof my !== 'undefined') {
    return my;
  }
  return wx;
}
