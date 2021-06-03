import { BezierPath } from "./bezier_path";
import { EllipsePath } from "./ellipse_path";
import { RectPath } from "./rect_path";
import { SpriteEntity } from "./sprite_entity";
import { VideoEntity } from "./video_entity";

interface Point {
  x: number;
  y: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface DynamicText {
  text: string;
  size: number;
  family: string;
  color: string;
  offset: { x: number; y: number };
}

const validMethods = "MLHVCSQRZmlhvcsqrz";

export class Renderer {
  constructor(
    readonly videoItem: VideoEntity,
    readonly ctx: WechatMiniprogram.CanvasContext,
    readonly canvas: WechatMiniprogram.Canvas
  ) {}

  globalTransform?: {
    a: number;
    b: number;
    c: number;
    d: number;
    tx: number;
    ty: number;
  };

  _dynamicImage: { [key: string]: any } = {};
  _dynamicText: { [key: string]: DynamicText } = {};

  clear() {
    const ctx = this.ctx;
    const areaFrame = {
      x: 0.0,
      y: 0.0,
      width: this.canvas.width,
      height: this.canvas.height,
    };
    ctx.clearRect(areaFrame.x, areaFrame.y, areaFrame.width, areaFrame.height);
  }

  drawFrame(frame: number) {
    const ctx = this.ctx;
    const areaFrame = {
      x: 0.0,
      y: 0.0,
      width: this.canvas.width,
      height: this.canvas.height,
    };
    ctx.clearRect(areaFrame.x, areaFrame.y, areaFrame.width, areaFrame.height);

    var matteSprites: any = {};
    var isMatteing = false;

    var sprites = this.videoItem.sprites;
    sprites.forEach((sprite, index) => {
      if (sprites[0].imageKey?.indexOf(".matte") == -1) {
        this.drawSprite(sprite, frame);
        return;
      }
      if (sprite.imageKey?.indexOf(".matte") != -1) {
        matteSprite[sprite.imageKey!] = sprite;
        return;
      }
      var lastSprite = sprites[index - 1];
      if (
        isMatteing &&
        (!sprite.matteKey ||
          sprite.matteKey.length == 0 ||
          sprite.matteKey != lastSprite.matteKey)
      ) {
        isMatteing = false;

        var matteSprite = matteSprites[sprite.matteKey!];
        ctx.globalCompositeOperation = "destination-in";
        this.drawSprite(matteSprite, frame);
        ctx.globalCompositeOperation = "source-over";
        ctx.restore();
      }
      if (
        sprite.matteKey != null &&
        (lastSprite.matteKey == null ||
          lastSprite.matteKey.length == 0 ||
          lastSprite.matteKey != sprite.matteKey)
      ) {
        isMatteing = true;
        ctx.save();
      }
      this.drawSprite(sprite, frame);

      if (isMatteing && index == sprites.length - 1) {
        var matteSprite = matteSprites.get(sprite.matteKey);
        ctx.globalCompositeOperation = "destination-in";
        this.drawSprite(matteSprite, frame);
        ctx.globalCompositeOperation = "source-over";
        ctx.restore();
      }
    });
  }

  drawSprite(sprite: SpriteEntity, frameIndex: number) {
    let frameItem = sprite.frames[frameIndex];
    if (frameItem.alpha < 0.05) {
      return;
    }
    const ctx = this.ctx;
    ctx.save();
    if (this.globalTransform) {
      ctx.transform(
        this.globalTransform.a,
        this.globalTransform.b,
        this.globalTransform.c,
        this.globalTransform.d,
        this.globalTransform.tx,
        this.globalTransform.ty
      );
    }
    ctx.globalAlpha = frameItem.alpha;
    ctx.transform(
      frameItem.transform.a,
      frameItem.transform.b,
      frameItem.transform.c,
      frameItem.transform.d,
      frameItem.transform.tx,
      frameItem.transform.ty
    );
    let bitmapKey = sprite.imageKey?.replace(".matte", "");
    if (!bitmapKey) return;
    let img =
      this._dynamicImage[bitmapKey] ?? this.videoItem.decodedImages[bitmapKey];
    if (frameItem.maskPath !== undefined && frameItem.maskPath !== null) {
      frameItem.maskPath._styles = undefined;
      this.drawBezier(frameItem.maskPath);
      ctx.clip();
    }
    if (img) {
      ctx.drawImage(
        img,
        0,
        0,
        img.width,
        img.height,
        0,
        0,
        frameItem.layout.width,
        frameItem.layout.height
      );
    }

    frameItem.shapes &&
      frameItem.shapes.forEach((shape: any) => {
        if (shape.type === "shape" && shape.pathArgs && shape.pathArgs.d) {
          this.drawBezier(
            new BezierPath(shape.pathArgs.d, shape.transform, shape.styles)
          );
        }
        if (shape.type === "ellipse" && shape.pathArgs) {
          this.drawEllipse(
            new EllipsePath(
              parseFloat(shape.pathArgs.x) || 0.0,
              parseFloat(shape.pathArgs.y) || 0.0,
              parseFloat(shape.pathArgs.radiusX) || 0.0,
              parseFloat(shape.pathArgs.radiusY) || 0.0,
              shape.transform,
              shape.styles
            )
          );
        }
        if (shape.type === "rect" && shape.pathArgs) {
          this.drawRect(
            new RectPath(
              parseFloat(shape.pathArgs.x) || 0.0,
              parseFloat(shape.pathArgs.y) || 0.0,
              parseFloat(shape.pathArgs.width) || 0.0,
              parseFloat(shape.pathArgs.height) || 0.0,
              parseFloat(shape.pathArgs.cornerRadius) || 0.0,
              shape.transform,
              shape.styles
            )
          );
        }
      });
    let dynamicText = this._dynamicText[bitmapKey];
    if (dynamicText !== undefined) {
      ctx.font = `${dynamicText.size}px ${dynamicText.family ?? "Arial"}`;
      let textWidth = ctx.measureText(dynamicText.text).width;
      ctx.fillStyle = dynamicText.color;
      let offsetX =
        dynamicText.offset !== undefined && dynamicText.offset.x !== undefined
          ? isNaN(dynamicText.offset.x)
            ? 0
            : dynamicText.offset.x
          : 0;
      let offsetY =
        dynamicText.offset !== undefined && dynamicText.offset.y !== undefined
          ? isNaN(dynamicText.offset.y)
            ? 0
            : dynamicText.offset.y
          : 0;
      ctx.fillText(
        dynamicText.text,
        (frameItem.layout.width - textWidth) / 2 + offsetX,
        frameItem.layout.height / 2 + offsetY
      );
    }
    ctx.restore();
  }

  playAudio(frame: number) {}

  resetShapeStyles(obj: any) {
    const ctx = this.ctx;
    const styles = obj._styles;
    if (!styles) {
      return;
    }
    if (styles && styles.stroke) {
      ctx.strokeStyle = `rgba(${(styles.stroke[0] * 255).toFixed(0)}, ${(
        styles.stroke[1] * 255
      ).toFixed(0)}, ${(styles.stroke[2] * 255).toFixed(0)}, ${
        styles.stroke[3]
      })`;
    } else {
      ctx.strokeStyle = "transparent";
    }
    if (styles) {
      ctx.lineWidth = styles.strokeWidth || undefined;
      ctx.lineCap = styles.lineCap || undefined;
      ctx.lineJoin = styles.lineJoin || undefined;
      ctx.miterLimit = styles.miterLimit || undefined;
    }
    if (styles && styles.fill) {
      ctx.fillStyle = `rgba(${(styles.fill[0] * 255).toFixed(0)}, ${(
        styles.fill[1] * 255
      ).toFixed(0)}, ${(styles.fill[2] * 255).toFixed(0)}, ${styles.fill[3]})`;
    } else {
      ctx.fillStyle = "transparent";
    }
    if (styles && styles.lineDash) {
      ctx.setLineDash(
        [styles.lineDash[0], styles.lineDash[1]],
        styles.lineDash[2]
      );
    }
  }

  drawBezier(obj: any) {
    const ctx = this.ctx;
    ctx.save();
    this.resetShapeStyles(obj);
    if (obj._transform !== undefined && obj._transform !== null) {
      ctx.transform(
        obj._transform.a,
        obj._transform.b,
        obj._transform.c,
        obj._transform.d,
        obj._transform.tx,
        obj._transform.ty
      );
    }
    let currentPoint: Point = { x: 0, y: 0, x1: 0, y1: 0, x2: 0, y2: 0 };
    ctx.beginPath();
    const d = obj._d.replace(/([a-zA-Z])/g, "|||$1 ").replace(/,/g, " ");
    d.split("|||").forEach((segment: string) => {
      if (segment.length == 0) {
        return;
      }
      const firstLetter = segment.substr(0, 1);
      if (validMethods.indexOf(firstLetter) >= 0) {
        const args = segment.substr(1).trim().split(" ");
        this.drawBezierElement(currentPoint, firstLetter, args);
      }
    });
    if (obj._styles && obj._styles.fill) {
      ctx.fill();
    }
    if (obj._styles && obj._styles.stroke) {
      ctx.stroke();
    }
    ctx.restore();
  }

  drawBezierElement(currentPoint: Point, method: string, args: any) {
    const ctx = this.ctx;
    switch (method) {
      case "M":
        currentPoint.x = Number(args[0]);
        currentPoint.y = Number(args[1]);
        ctx.moveTo(currentPoint.x, currentPoint.y);
        break;
      case "m":
        currentPoint.x += Number(args[0]);
        currentPoint.y += Number(args[1]);
        ctx.moveTo(currentPoint.x, currentPoint.y);
        break;
      case "L":
        currentPoint.x = Number(args[0]);
        currentPoint.y = Number(args[1]);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        break;
      case "l":
        currentPoint.x += Number(args[0]);
        currentPoint.y += Number(args[1]);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        break;
      case "H":
        currentPoint.x = Number(args[0]);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        break;
      case "h":
        currentPoint.x += Number(args[0]);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        break;
      case "V":
        currentPoint.y = Number(args[0]);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        break;
      case "v":
        currentPoint.y += Number(args[0]);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        break;
      case "C":
        currentPoint.x1 = Number(args[0]);
        currentPoint.y1 = Number(args[1]);
        currentPoint.x2 = Number(args[2]);
        currentPoint.y2 = Number(args[3]);
        currentPoint.x = Number(args[4]);
        currentPoint.y = Number(args[5]);
        ctx.bezierCurveTo(
          currentPoint.x1,
          currentPoint.y1,
          currentPoint.x2,
          currentPoint.y2,
          currentPoint.x,
          currentPoint.y
        );
        break;
      case "c":
        currentPoint.x1 = currentPoint.x + Number(args[0]);
        currentPoint.y1 = currentPoint.y + Number(args[1]);
        currentPoint.x2 = currentPoint.x + Number(args[2]);
        currentPoint.y2 = currentPoint.y + Number(args[3]);
        currentPoint.x += Number(args[4]);
        currentPoint.y += Number(args[5]);
        ctx.bezierCurveTo(
          currentPoint.x1,
          currentPoint.y1,
          currentPoint.x2,
          currentPoint.y2,
          currentPoint.x,
          currentPoint.y
        );
        break;
      case "S":
        if (
          currentPoint.x1 &&
          currentPoint.y1 &&
          currentPoint.x2 &&
          currentPoint.y2
        ) {
          currentPoint.x1 = currentPoint.x - currentPoint.x2 + currentPoint.x;
          currentPoint.y1 = currentPoint.y - currentPoint.y2 + currentPoint.y;
          currentPoint.x2 = Number(args[0]);
          currentPoint.y2 = Number(args[1]);
          currentPoint.x = Number(args[2]);
          currentPoint.y = Number(args[3]);
          ctx.bezierCurveTo(
            currentPoint.x1,
            currentPoint.y1,
            currentPoint.x2,
            currentPoint.y2,
            currentPoint.x,
            currentPoint.y
          );
        } else {
          currentPoint.x1 = Number(args[0]);
          currentPoint.y1 = Number(args[1]);
          currentPoint.x = Number(args[2]);
          currentPoint.y = Number(args[3]);
          ctx.quadraticCurveTo(
            currentPoint.x1,
            currentPoint.y1,
            currentPoint.x,
            currentPoint.y
          );
        }
        break;
      case "s":
        if (
          currentPoint.x1 &&
          currentPoint.y1 &&
          currentPoint.x2 &&
          currentPoint.y2
        ) {
          currentPoint.x1 = currentPoint.x - currentPoint.x2 + currentPoint.x;
          currentPoint.y1 = currentPoint.y - currentPoint.y2 + currentPoint.y;
          currentPoint.x2 = currentPoint.x + Number(args[0]);
          currentPoint.y2 = currentPoint.y + Number(args[1]);
          currentPoint.x += Number(args[2]);
          currentPoint.y += Number(args[3]);
          ctx.bezierCurveTo(
            currentPoint.x1,
            currentPoint.y1,
            currentPoint.x2,
            currentPoint.y2,
            currentPoint.x,
            currentPoint.y
          );
        } else {
          currentPoint.x1 = currentPoint.x + Number(args[0]);
          currentPoint.y1 = currentPoint.y + Number(args[1]);
          currentPoint.x += Number(args[2]);
          currentPoint.y += Number(args[3]);
          ctx.quadraticCurveTo(
            currentPoint.x1,
            currentPoint.y1,
            currentPoint.x,
            currentPoint.y
          );
        }
        break;
      case "Q":
        currentPoint.x1 = Number(args[0]);
        currentPoint.y1 = Number(args[1]);
        currentPoint.x = Number(args[2]);
        currentPoint.y = Number(args[3]);
        ctx.quadraticCurveTo(
          currentPoint.x1,
          currentPoint.y1,
          currentPoint.x,
          currentPoint.y
        );
        break;
      case "q":
        currentPoint.x1 = currentPoint.x + Number(args[0]);
        currentPoint.y1 = currentPoint.y + Number(args[1]);
        currentPoint.x += Number(args[2]);
        currentPoint.y += Number(args[3]);
        ctx.quadraticCurveTo(
          currentPoint.x1,
          currentPoint.y1,
          currentPoint.x,
          currentPoint.y
        );
        break;
      case "A":
        break;
      case "a":
        break;
      case "Z":
      case "z":
        ctx.closePath();
        break;
      default:
        break;
    }
  }

  drawEllipse(obj: any) {
    const ctx = this.ctx;
    ctx.save();
    this.resetShapeStyles(obj);
    if (obj._transform !== undefined && obj._transform !== null) {
      ctx.transform(
        obj._transform.a,
        obj._transform.b,
        obj._transform.c,
        obj._transform.d,
        obj._transform.tx,
        obj._transform.ty
      );
    }
    let x = obj._x - obj._radiusX;
    let y = obj._y - obj._radiusY;
    let w = obj._radiusX * 2;
    let h = obj._radiusY * 2;
    var kappa = 0.5522848,
      ox = (w / 2) * kappa,
      oy = (h / 2) * kappa,
      xe = x + w,
      ye = y + h,
      xm = x + w / 2,
      ym = y + h / 2;

    ctx.beginPath();
    ctx.moveTo(x, ym);
    ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
    ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
    ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
    ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
    if (obj._styles && obj._styles.fill) {
      ctx.fill();
    }
    if (obj._styles && obj._styles.stroke) {
      ctx.stroke();
    }
    ctx.restore();
  }

  drawRect(obj: any) {
    const ctx = this.ctx;
    ctx.save();
    this.resetShapeStyles(obj);
    if (obj._transform !== undefined && obj._transform !== null) {
      ctx.transform(
        obj._transform.a,
        obj._transform.b,
        obj._transform.c,
        obj._transform.d,
        obj._transform.tx,
        obj._transform.ty
      );
    }

    let x = obj._x;
    let y = obj._y;
    let width = obj._width;
    let height = obj._height;
    let radius = obj._cornerRadius;

    if (width < 2 * radius) {
      radius = width / 2;
    }
    if (height < 2 * radius) {
      radius = height / 2;
    }

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();

    if (obj._styles && obj._styles.fill) {
      ctx.fill();
    }
    if (obj._styles && obj._styles.stroke) {
      ctx.stroke();
    }
    ctx.restore();
  }
}
