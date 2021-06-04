# svgaplayer-weapp

专为微信小程序开发的 SVGA 播放器，已在 iOS 及 Android 手机上测试通过。

示例代码片段 https://developers.weixin.qq.com/s/u2JBSOmy7rqU

## 安装方法

### 原生小程序

1. 直接复制 `./dist/svgaplayer.weapp.js` 到你的小程序工程目录下。

2. 在需要添加播放器的 `wxml` 文件内，添加 `canvas` 组件，注意 canvas 的 id 必填，下一步会用到，type 必须为 2d。

```xml
<view class="container">
  <canvas id="demoCanvas" type="2d" style="width: 300px; height: 300px; background-color: black"></canvas>
</view>
```

3. 在需要播放的时机，这里是 `onLoad`，执行以下代码，即可播放动画。

```js
const { Parser, Player } = require("../../libs/svgaplayer.weapp"); // 此处替换为 svgaplayer.weapp.js 放置位置

Page({
  data: {
  },
  async onLoad() {
    try {
      const parser = new Parser;
      const player = new Player;
      await player.setCanvas('#demoCanvas')
      const videoItem = await parser.load("https://cdn.jsdelivr.net/gh/svga/SVGA-Samples@master/angel.svga");
      await player.setVideoItem(videoItem);
      player.startAnimation();
    } catch (error) {
      console.log(error);
    }
  },
})
```

### Taro

1. 通过 `npm install git+https://github.com/svga/svgaplayer-weapp.git --save` 安装依赖。

2. 参照以下代码添加 Canvas 并配置动画。

```typescript
import { Component } from 'react'
import { View, Text, Canvas } from '@tarojs/components'
import { Parser, Player } from "svgaplayer-weapp";

import "taro-ui/dist/style/components/button.scss" // 按需引入
import './index.scss'

export default class Index extends Component {

  componentDidMount () {
    this.loadAnimation();
  }

  async loadAnimation() {
    const parser = new Parser;
    const player = new Player;
    await player.setCanvas('#demoCanvas')
    const videoItem = await parser.load("https://cdn.jsdelivr.net/gh/svga/SVGA-Samples@master/angel.svga");
    await player.setVideoItem(videoItem);
    player.startAnimation();
  }

  render () {
    return (
      <View className='index'>
        <Canvas type="2d" id="demoCanvas" style={{width: "300px", height: "300px", backgroundColor: "black"}} />
      </View>
    )
  }
}
```

### Types

npm 包已附带 `Types`，可支持 `TypeScript` 代码提示。

## API

### Parser

`load(url: string): Promise<VideoEntity>`

从网络或本地资源包加载 `VideoEntity`。

### Player

`loops = 0`
属性，设置当前动画的循环次数，0代表无限循环。

`clearsAfterStop = true`
属性，为 true 时，表示动画停止播放后默认清空画布。

`fillMode = "Forward"`
属性，为 Forward 时，表示动画播放结束后保留在最后一帧。为 Backward 时，表示保留在第一帧。

`async setCanvas(selector: string): Promise<any>`
设置目标 canvas，这里需要填入 selector，比如 id="demoCanvas"，则填 #demoCanvas。

`async setVideoItem(videoItem?: VideoEntity): Promise<any>`
设置需要播放的 `VideoEntity` 动画实体。

`setContentMode(contentMode: string)`
设置动画缩放模式，可选值为 Fill / AspectFill / AspectFit。

`startAnimation(reverse: boolean = false)`
开始播放动画，reverse = true 时则反向播放。

`startAnimationWithRange(range: Range, reverse: boolean = false)`
开始播放动画，在指定 `Range` 内播放。

`pauseAnimation()`
暂停播放动画。

`stopAnimation(clear?: boolean)`
停止播放动画，当 clear 为 true 时，清空画布。

`clear()`
清空画布

`stepToFrame(frame: number, andPlay: boolean = false)`
跳转动画的指定帧，andPlay 为 true 时，从该帧开始播放动画。

`stepToPercentage(percentage: number, andPlay: boolean = false)`
跳转动画的指定进度百分比，andPlay 为 true 时，从该帧开始播放动画。

`async setImage(src: Uint8Array | string, forKey: string): Promise<any>`
使用图片替换指定元素

`setText(dynamicText: DynamicText, forKey: string)`
添加文本到指定元素上

`clearDynamicObjects()`
清空所有替换元素。

`onFinished(callback: () => void)`
监听动画完成

`onFrame(callback: (frame: number) => void)`
监听动画播放过程中，当前帧的变化。

`onPercentage(callback: (percentage: number) => void)`
监听动画播放过程中，当前进度的变化。

### Range

```js
interface Range {
  location: number; // 起始帧
  length: number; // 长度
}
```

### DynamicText

```js
interface DynamicText {
  text: string;
  size: number;
  family: string;
  color: string;
  offset: { x: number; y: number };
}
```