import { BezierPath } from "./bezier_path";

export class RectPath extends BezierPath {
  _x;
  _y;
  _width;
  _height;
  _cornerRadius;
  _transform;
  _styles;

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    cornerRadius: number,
    transform: any,
    styles: any
  ) {
    super("", transform, styles);
    this._x = x;
    this._y = y;
    this._width = width;
    this._height = height;
    this._cornerRadius = cornerRadius;
    this._transform = transform;
    this._styles = styles;
  }
}
