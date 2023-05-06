## WS E-ink 7.5inch V2 NodeJS driver

Based on their Wi-Fi Loader DEMO, this code was extracted, refactored to support TS NodeJS.

Tested on Waveshare 7.5inch V2

### Features
* Dithering Mono
* Ready to transmit output


### Usage

```ts
const myImage = new ImageData(480, 800);
let toEink = procImg(myImage); // Ready to transmit Data, Array of bytes  
```
