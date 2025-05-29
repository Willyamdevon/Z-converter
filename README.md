## Build 

```shell
git clone https://github.com/Willyamdevon/cu_converter
npm init -y
npm install --save-dev electron
```

pakage.json:
```json
{
  "name": "my-electron-app",
  "version": "1.0.0",
  "main": "main.js",
  "scripts": {
    "start": "electron ."
  },
  "devDependencies": {
    "electron": "^28.0.0"
  }
}
```

then:
```shell
npm start
```
