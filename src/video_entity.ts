import { SpriteEntity } from "./sprite_entity";

export class VideoEntity {
  version = "2.0.0";

  videoSize: {
    width: number;
    height: number;
  };

  FPS: number;

  frames: number;

  sprites: SpriteEntity[];

  audios: any[];

  decodedImages: { [key: string]: any } = {};

  constructor(
    readonly spec: any
  ) {
    this.version = spec.ver;
    this.videoSize = {
      width: spec.params.viewBoxWidth || 0.0,
      height: spec.params.viewBoxHeight || 0.0,
    };
    this.FPS = spec.params.fps || 20;
    this.frames = spec.params.frames || 0;
    this.sprites =
      spec.sprites?.map((obj: any) => {
        return new SpriteEntity(obj);
      }) ?? [];
    this.audios = [];
  }
}
