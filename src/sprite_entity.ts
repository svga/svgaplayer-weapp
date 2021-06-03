import { FrameEntity } from "./frame_entity";

export class SpriteEntity {
  matteKey?: string;

  imageKey?: string;

  frames: any[];

  constructor(spec: any) {
    this.matteKey = spec.matteKey;
    this.imageKey = spec.imageKey;
    this.frames =
      spec.frames?.map((obj: any) => {
        return new FrameEntity(obj);
      }) ?? [];
  }
}
