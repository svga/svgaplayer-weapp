import { VideoEntity } from "./video_entity";
import { getMiniBridge } from "./adaptor";
const { inflate } = require("./pako");
const { ProtoMovieEntity } = require("./proto");
const wx = getMiniBridge();

export class Parser {
  load(url: string): Promise<VideoEntity> {
    return new Promise((resolver, rejector) => {
      if (url.indexOf("http://") === 0 || url.indexOf("https://") === 0) {
        wx.request({
          url: url,
          // @ts-ignore
          dataType: "arraybuffer",
          responseType: "arraybuffer",
          success: (res) => {
            try {
              const inflatedData = inflate(res.data as any);
              const movieData = ProtoMovieEntity.decode(inflatedData);
              resolver(new VideoEntity(movieData));
            } catch (error) {
              rejector(error);
            }
          },
          fail: (error) => {
            rejector(error);
          },
        });
      } else {
        wx.getFileSystemManager().readFile({
          filePath: url,
          success: (res) => {
            try {
              const inflatedData = inflate(res.data as any);
              const movieData = ProtoMovieEntity.decode(inflatedData);
              resolver(new VideoEntity(movieData));
            } catch (error) {
              rejector(error);
            }
          },
          fail: (error) => {
            rejector(error);
          },
        });
      }
    });
  }
}
