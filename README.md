# svgaplayer-weapp

专为微信小程序开发的 SVGA 播放器，已在 iOS 及 Android 手机上测试通过。

示例代码片段 https://developers.weixin.qq.com/s/grK1TTmt7pth

请仔细阅读文档和示例，如有疑问，可添加作者微信(ponycui)，可提供技术服务。

## 支持本仓库

轻点 GitHub Star，让更多人看到该项目。

关注作者另外一个开源项目，[MPFlutter](https://mpflutter.com)，使用 Flutter 开发微信小程序。

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

### 原生小程序（支付宝）
1. 直接复制 `./dist/svgaplayer.weapp.js` 到你的小程序工程目录下。

2. 由于需要使用到[my.getFileSystemManager](https://opendocs.alipay.com/mini/api/0226oc)相关的API，请先为小程序添加[文件管理器](https://opendocs.alipay.com/mini/introduce/022rw2#%E6%B7%BB%E5%8A%A0%E8%83%BD%E5%8A%9B)能力。添加完毕后需要重新预览方可调用相关API。

3. 在需要添加播放器的 `axml` 文件内，添加 `canvas` 组件，注意 canvas 的 id 必填，后面会用到，且type 必须为 2d。因为svga动画所需的各项前置能力支付宝基础库2.7.3以上才全部支持，请确保支付宝小程序已[启用基础库2.0](https://opendocs.alipay.com/mini/framework/lib-upgrade-v2)。

```xml
<!-- page.axml -->
<view class="container">
  <canvas id="demoCanvas" type="2d" onReady="onCanvasReady" style="width: 300px; height: 300px; background-color: black"></canvas>
</view>
```

4. 在需要播放的时机，播放svga逻辑请在[onReady事件](https://opendocs.alipay.com/mini/component/canvas)触发之后执行，在这个时刻之前执行可能因native canvas还未初始化完毕而出现异常。

5. 若需要读取本地文件，需要在`mini.project.json`内配置需要读取的内容。例如
```json
{
  "include": [
    "assets/*.svg"
  ]
}
```

```js
const { Parser, Player } = require("../../libs/svgaplayer.weapp"); // 此处替换为 svgaplayer.weapp.js 放置位置

Page({
  data: {
  },
  async onCanvasReady() {
    try {
      const parser = new Parser;
      const player = new Player;
      await player.setCanvas('#demoCanvas')
      // await player.setCanvas('#demoCanvas', this.selectComponent('#component_id'))
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

`async setCanvas(selector: string, component?: Component.TrivialInstance): Promise<any>`
设置目标 canvas，这里需要填入 selector，比如 id="demoCanvas"，则填 #demoCanvas。
如果 Canvas 在组件内，则在第二个参数填入 Component 的实例。

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

## 感谢或联系作者

![](https://cdn.jsdelivr.net/gh/PonyCui/ponycui.github.io@master/contact.png)
