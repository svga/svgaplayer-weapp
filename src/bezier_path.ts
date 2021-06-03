export class BezierPath {
  _d?: string;
  _transform?: any;
  _styles?: any;
  _shape?: any;

  constructor(
    readonly d: string,
    readonly transform: any,
    readonly styles: any
  ) {
    this._d = d;
    this._transform = transform;
    this._styles = styles;
  }
}
