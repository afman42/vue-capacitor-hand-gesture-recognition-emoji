# Vue 3 + CapacitorJS + Hand Gesture Recognition + Emoji + Android App

- Hanya Percobaan, bukan dari repo sebelumnya
- kodingan masih single file belum di pecah menjadi modular

```js
const gestureMap = {
  Victory: "✌️",
  Thumb_Up: "👍",
  Open_Palm: "✋",
  Closed_Fist: "✊",
  Pointing_Up: "☝️",
  ILoveYou: "🤟",
};
```

- testing
  - cari file apk debug di folder `./android/app/build/outputs/apk/debug/app-debug.apk`

- etc:
  - Need Android Studio, Java, NodeJS, Simulator or Hardware Device
  - `git clone "this repo"`
  - `npm install`
  - `npm run build`
  - `npx cap run android`
