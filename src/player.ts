"use strict";

import { Renderer } from "./renderer";
import { ValueAnimator } from "./value_animator";
import { VideoEntity } from "./video_entity";
import { getMiniBridge } from "./adaptor";

const wx = getMiniBridge();
interface Range {
  location: number;
  length: number;
}

interface DynamicText {
  text: string;
  size: number;
  family: string;
  color: string;
  offset: { x: number; y: number };
}

export class Player {
  canvas?: WechatMiniprogram.Canvas;
  ctx?: WechatMiniprogram.CanvasContext;

  async setCanvas(
    selector: string,
    component?: WechatMiniprogram.Component.TrivialInstance
  ): Promise<any> {
    return new Promise((resolver, rej) => {
      let query = wx.createSelectorQuery();
      if (component) {
        query = query.in(component);
      }
      query
        .select(selector)
        .fields({ node: true, size: true })
        .exec((res) => {
          this.canvas = res?.[0]?.node;
          if (!this.canvas) {
            rej("canvas not found.");
            return;
          }
          this.ctx = this.canvas!.getContext("2d");
          if (!this.ctx) {
            rej("canvas context not found.");
            return;
          }
          const dpr = wx.getSystemInfoSync().pixelRatio;
          this.canvas!.width = res[0].width * dpr;
          this.canvas!.height = res[0].height * dpr;
          resolver(undefined);
        });
    });
  }

  loops = 0;

  clearsAfterStop = true;

  fillMode = "Forward";

  _videoItem?: VideoEntity;

  async setVideoItem(videoItem?: VideoEntity): Promise<any> {
    this._currentFrame = 0;
    this._videoItem = videoItem;
    if (videoItem) {
      const keyedImages = await Promise.all(
        Object.keys(videoItem.spec.images).map(async (it) => {
          try {
            const data = await this.loadWXImage(videoItem.spec.images[it]);
            return { key: it, value: data };
          } catch (error) {
            return { key: it, value: undefined };
          }
        })
      );
      let decodedImages: { [key: string]: any } = {};
      keyedImages.forEach((it) => {
        decodedImages[it.key] = it.value;
      });
      videoItem.decodedImages = decodedImages;
      this._renderer = new Renderer(this._videoItem!, this.ctx!, this.canvas!);
    } else {
      this._renderer = undefined;
    }
    this.clear();
    this._update();
  }

  loadWXImage(data: Uint8Array | string): Promise<any> {
    if (!this.canvas) throw "no canvas";
    return new Promise((res, rej) => {
      const img: WechatMiniprogram.Image = this.canvas!.createImage();
      img.onload = () => {
        res(img);
      };
      img.onerror = (error) => {
        console.log(error);
        rej("image decoded fail.");
      };
      if (typeof data === "string") {
        img.src = data;
      } else {
        img.src = "data:image/png;base64," + wx.arrayBufferToBase64(data);
      }
    });
  }

  _contentMode = "AspectFit";

  setContentMode(contentMode: string) {
    this._contentMode = contentMode;
    this._update();
  }

  startAnimation(reverse: boolean = false) {
    this.stopAnimation(false);
    this._doStart(undefined, reverse, undefined);
  }

  startAnimationWithRange(range: Range, reverse: boolean = false) {
    this.stopAnimation(false);
    this._doStart(range, reverse, undefined);
  }

  pauseAnimation() {
    this.stopAnimation(false);
  }

  stopAnimation(clear?: boolean) {
    this._forwardAnimating = false;
    if (this._animator !== undefined) {
      this._animator.stop();
    }
    if (clear === undefined) {
      clear = this.clearsAfterStop;
    }
    if (clear) {
      this.clear();
    }
  }

  clear() {
    this._renderer?.clear();
    // this._renderer?.clearAudios();
  }

  stepToFrame(frame: number, andPlay: boolean = false) {
    const videoItem = this._videoItem;
    if (!videoItem) return;
    if (frame >= videoItem.frames || frame < 0) {
      return;
    }
    this.pauseAnimation();
    this._currentFrame = frame;
    this._update();
    if (andPlay) {
      this._doStart(undefined, false, this._currentFrame);
    }
  }

  stepToPercentage(percentage: number, andPlay: boolean = false) {
    const videoItem = this._videoItem;
    if (!videoItem) return;
    let frame = percentage * videoItem.frames;
    if (frame >= videoItem.frames && frame > 0) {
      frame = videoItem.frames - 1;
    }
    this.stepToFrame(frame, andPlay);
  }

  async setImage(src: Uint8Array | string, forKey: string): Promise<any> {
    const img = await this.loadWXImage(src);
    this._dynamicImage[forKey] = img;
  }

  setText(dynamicText: DynamicText, forKey: string) {
    this._dynamicText[forKey] = dynamicText;
  }

  clearDynamicObjects() {
    this._dynamicImage = {};
    this._dynamicText = {};
  }

  onFinished(callback: () => void) {
    this._onFinished = callback;
  }

  onFrame(callback: (frame: number) => void) {
    this._onFrame = callback;
  }

  onPercentage(callback: (percentage: number) => void) {
    this._onPercentage = callback;
  }

  /**
   * Private methods & properties
   */

  _renderer?: Renderer;
  _animator: ValueAnimator = new ValueAnimator();
  _forwardAnimating = false;
  _currentFrame = 0;
  _dynamicImage: { [key: string]: any } = {};
  _dynamicText: { [key: string]: DynamicText } = {};

  _onFinished?: () => void;
  _onFrame?: (frame: number) => void;
  _onPercentage?: (percentage: number) => void;

  _doStart(range?: Range, reverse: boolean = false, fromFrame: number = 0) {
    const videoItem = this._videoItem;
    if (!videoItem) return;
    this._animator = new ValueAnimator();
    this._animator.canvas = this.canvas;
    if (range !== undefined) {
      this._animator.startValue = Math.max(0, range.location);
      this._animator.endValue = Math.min(
        videoItem.frames - 1,
        range.location + range.length
      );
      this._animator.duration =
        (this._animator.endValue - this._animator.startValue + 1) *
        (1.0 / videoItem.FPS) *
        1000;
    } else {
      this._animator.startValue = 0;
      this._animator.endValue = videoItem.frames - 1;
      this._animator.duration = videoItem.frames * (1.0 / videoItem.FPS) * 1000;
    }
    this._animator.loops = this.loops <= 0 ? Infinity : this.loops;
    this._animator.fillRule = this.fillMode === "Backward" ? 1 : 0;
    this._animator.onUpdate = (value) => {
      if (this._currentFrame === Math.floor(value)) {
        return;
      }
      if (this._forwardAnimating && this._currentFrame > Math.floor(value)) {
        // this._renderer.clearAudios();
      }
      this._currentFrame = Math.floor(value);
      this._update();
      if (typeof this._onFrame === "function") {
        this._onFrame(this._currentFrame);
      }
      if (typeof this._onPercentage === "function") {
        this._onPercentage(this._currentFrame + 1 / videoItem.frames);
      }
    };
    this._animator.onEnd = () => {
      this._forwardAnimating = false;
      if (this.clearsAfterStop === true) {
        this.clear();
      }
      if (typeof this._onFinished === "function") {
        this._onFinished();
      }
    };
    if (reverse === true) {
      this._animator.reverse(fromFrame);
      this._forwardAnimating = false;
    } else {
      this._animator.start(fromFrame);
      this._forwardAnimating = true;
    }
    this._currentFrame = this._animator.startValue;
    this._update();
  }

  _resize() {
    const ctx = this.ctx;
    const videoItem = this._videoItem;
    if (!ctx) return;
    if (!videoItem) return;
    let scaleX = 1.0;
    let scaleY = 1.0;
    let translateX = 0.0;
    let translateY = 0.0;
    let targetSize = {
      width: this.canvas!.width,
      height: this.canvas!.height,
    };
    let imageSize = videoItem.videoSize;
    if (this._contentMode === "Fill") {
      scaleX = targetSize.width / imageSize.width;
      scaleY = targetSize.height / imageSize.height;
    } else if (
      this._contentMode === "AspectFit" ||
      this._contentMode === "AspectFill"
    ) {
      const imageRatio = imageSize.width / imageSize.height;
      const viewRatio = targetSize.width / targetSize.height;
      if (
        (imageRatio >= viewRatio && this._contentMode === "AspectFit") ||
        (imageRatio <= viewRatio && this._contentMode === "AspectFill")
      ) {
        scaleX = scaleY = targetSize.width / imageSize.width;
        translateY = (targetSize.height - imageSize.height * scaleY) / 2.0;
      } else if (
        (imageRatio < viewRatio && this._contentMode === "AspectFit") ||
        (imageRatio > viewRatio && this._contentMode === "AspectFill")
      ) {
        scaleX = scaleY = targetSize.height / imageSize.height;
        translateX = (targetSize.width - imageSize.width * scaleX) / 2.0;
      }
    }
    if (this._renderer) {
      this._renderer.globalTransform = {
        a: scaleX,
        b: 0.0,
        c: 0.0,
        d: scaleY,
        tx: translateX,
        ty: translateY,
      };
    }
  }

  _update() {
    this._resize();
    if (this._renderer) {
      this._renderer._dynamicImage = this._dynamicImage;
      this._renderer._dynamicText = this._dynamicText;
      this._renderer.drawFrame(this._currentFrame);
      this._renderer.playAudio(this._currentFrame);
    }
  }
}
