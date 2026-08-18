# 隐私与摄像头处理 / Privacy and Camera Processing

## 中文

回 · 手势八卦可以使用摄像头识别单手动作，也可以在不启用摄像头的情况下使用鼠标和键盘体验。

1. 摄像头只会在使用者点击“启用摄像头”后请求权限。
2. MediaPipe Hands 在使用者的浏览器中处理视频帧并输出手部关键点。
3. 项目代码不会把摄像头视频或手部关键点发送到科技回锅肉的服务器或任何 AI 服务。
4. 项目不会录制、截图、保存视频或建立生物识别身份。
5. 项目不包含广告像素、分析 SDK 或行为追踪器。
6. 页面会从 jsDelivr 下载 MediaPipe 运行文件；该网络请求可能向 CDN 暴露常规请求信息，但不包含摄像头画面。
7. 点击右上角停止按钮、按 Esc 或关闭页面时，项目会停止浏览器的摄像头轨道。
8. 使用者拒绝摄像头权限后，项目自动切换到手动模式。

## English

HUI · Gesture Bagua can recognize single-hand movement through the camera, but the complete primary experience is also available through mouse and keyboard input.

1. Camera permission is requested only after the user selects “Enable Camera.”
2. MediaPipe Hands processes video frames in the user’s browser and returns hand landmarks.
3. Project code does not send camera video or hand landmarks to a server operated by 科技回锅肉 or to an AI service.
4. The project does not record, capture or save video and does not create a biometric identity.
5. The project includes no advertising pixels, analytics SDKs or behavioral trackers.
6. MediaPipe runtime files are downloaded from jsDelivr. That request may expose ordinary network request information to the CDN, but it does not contain camera frames.
7. The camera tracks stop when the user selects the stop control, presses Esc, or closes the page.
8. If camera permission is denied, the project falls back to manual mode.
