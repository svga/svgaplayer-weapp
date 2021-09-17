export class Parser {
  load(url: string): Promise<VideoEntity>;
}

export class Player {
  loops: number;
  clearsAfterStop: boolean;
  fillMode: "Forward" | "Backward";
  async setCanvas(selector: string, component?: any): Promise<any>;
  async setVideoItem(videoItem?: VideoEntity): Promise<any>;
  setContentMode(contentMode: "AspectFit" | "AspectFill" | "Fill");
  startAnimation(reverse?: boolean);
  startAnimationWithRange(range: Range, reverse?: boolean);
  pauseAnimation();
  stopAnimation(clear?: boolean);
  clear();
  stepToFrame(frame: number, andPlay?: boolean);
  stepToPercentage(percentage: number, andPlay?: boolean);
  async setImage(src: Uint8Array | string, forKey: string): Promise<any>;
  setText(dynamicText: DynamicText, forKey: string);
  clearDynamicObjects();
  onFinished(callback: () => void);
  onFrame(callback: (frame: number) => void);
  onPercentage(callback: (percentage: number) => void);
}

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

export default svgaplayer - weapp;
