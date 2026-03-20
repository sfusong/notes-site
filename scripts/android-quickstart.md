# Android Quickstart

当前项目已经支持在仓库内放一套独立 Android SDK。
Android APK 当前采用“空壳 + 首次同步”模式：

- APK 内不再打包 `notes/`
- 第一次打开 App 后，手动点击“同步我的笔记”
- 同步完成后，笔记会缓存到手机本地，后续离线也能阅读

首次准备：

1. 在项目根目录运行 `npm install`
2. 如需重新同步 Web 资源，运行 `npm run cap:sync`
3. 如需打 debug APK，运行 `npm run android:build:debug`
   - 这个脚本会把 Gradle 缓存放在项目内的 `.gradle-home`

如果本机还没有 Android SDK，可按下面方式准备：

1. 下载 Android command-line tools
2. 解压到项目内的 `.android-sdk/cmdline-tools/latest`
3. 安装这些组件：
   - `platform-tools`
   - `platforms;android-34`
   - `build-tools;34.0.0`
4. 在 `android/local.properties` 写入：

```properties
sdk.dir=/Users/shifusong/notes-site/.android-sdk
```

打包完成后，debug APK 常见路径：

- `android/app/build/outputs/apk/debug/app-debug.apk`
