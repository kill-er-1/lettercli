# lettercli

一个 Node.js 命令行工具：把名字渲染成终端艺术字（FIGlet），并支持渐变、阴影、居中、清屏与动画输出。

## 安装与运行

本项目是 ESM（`type: module`），建议使用 Node.js 18+（你用 Node 22 更合适）。

```bash
npm install
```

本地直接运行：

```bash
node bin/lettercli.js c
```

本地注册为命令（可选）：

```bash
npm link
lettercli cd
```

全局安装（发布到 npm 后）：

```bash
npm i -g lettercli
lettercli
```

## 用法

```bash
lettercli <text> [options]
```

### 常用示例

交互模式（启动后会出现输入框，回车就渲染；`:q` 退出）：

```bash
lettercli --interactive
# 或
lettercli -i
```

交互模式 + 固定样式：

```bash
lettercli -i -g mind -s -c -a line -p fast
```

渐变 + 阴影 + 居中 + 逐行动画：

```bash
lettercli cdx --gradient mind --shadow --center --animate line --speed fast
```

字距更宽（避免字母“挤在一起”）：

```bash
lettercli cd --h-layout full
```

stdin 管道输入：

```bash
echo "cdx" | lettercli --gradient retro
```

中文输入（默认不走 FIGlet 大字渲染，但仍可渐变/居中/动画）：

```bash
lettercli "中文名" --gradient vice --center
```

## 参数

* `--interactive, -i`：交互式输入循环模式（有提示与输入框）
* `--font, -f <name>`：FIGlet 字体，默认 `Slant`
* `--h-layout, -H <mode>`：FIGlet 横向布局（影响字距）
  * 推荐：`full`（间距更大，不 smush）
* `--v-layout, -V <mode>`：FIGlet 纵向布局（影响行距）
* `--gradient, -g <name|c1,c2,...>`：渐变预设或自定义颜色列表
  * 预设名示例：`mind`、`retro`、`vice`、`rainbow`、`pastel` 等
  * 自定义颜色列表示例：`--gradient "blue,purple"`、`--gradient "#00f,#f0f,#f90"`
* `--gradient-mode, -m <horizontal|vertical>`：渐变方向（也支持 `-m h` / `-m v`）
  * `horizontal`：对多行艺术字使用同一条水平渐变并对齐色带（更稳定）
  * `vertical`：按行变化渐变（对预设名会尽量退化到合理效果）
* `--shadow, -s / --no-shadow`：阴影开关
* `--shadow-x, -x <n>`：阴影右偏移，默认 `3`
* `--shadow-y, -y <n>`：阴影下偏移，默认 `1`
* `--center, -c / --no-center`：居中开关（默认在 TTY 下自动居中）
* `--clear, -C`：渲染前清屏
* `--animate, -a <none|line|char>`：动画方式
* `--speed, -p <slow|medium|fast|ms>`：动画速度

## 发布到 npm

```bash
npm login
npm publish --access public
```
