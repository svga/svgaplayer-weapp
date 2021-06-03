import { BezierPath } from "./bezier_path";

export class EllipsePath extends BezierPath {
  _x;
  _y;
  _radiusX;
  _radiusY;
  _transform;
  _styles;

  constructor(x: number, y: number, radiusX: number, radiusY: number, transform: any, styles: any) {
    super('', transform, styles);
    this._x = x;
    this._y = y;
    this._radiusX = radiusX;
    this._radiusY = radiusY;
    this._transform = transform;
    this._styles = styles;
  }
}
