function toEinkFormat(a: number[]) {
  const rqMsg = [];
  let pxInd = 0;
  const c = 0;
  while (pxInd < a.length && rqMsg.length < 1500) {
    let v = 0;
    for (let i = 0; i < 8; i++) {
      if (pxInd < a.length && a[pxInd] != c) v |= 128 >> i;
      pxInd++;
    }
    rqMsg.push(v);
  }

  return rqMsg;
}

const curPal = [
  [0, 0, 0],
  [255, 255, 255],
];

function getErr(r: number, g: number, b: number, stdCol: number[]) {
  r -= stdCol[0];
  g -= stdCol[1];
  b -= stdCol[2];
  return r * r + g * g + b * b;
}

function getVal(p: ImageData, i: number) {
  if (p.data[i] == 0x00 && p.data[i + 1] == 0x00) return 0;
  if (p.data[i] == 0xff && p.data[i + 1] == 0xff) return 1;
  if (p.data[i] == 0x7f && p.data[i + 1] == 0x7f) return 2;
  return 3;
}

function setVal(p: ImageData, i: number, c: number) {
  p.data[i] = curPal[c][0];
  p.data[i + 1] = curPal[c][1];
  p.data[i + 2] = curPal[c][2];
  p.data[i + 3] = 255;
}

function addVal(c: number[], r: number, g: number, b: number, k: number) {
  return [c[0] + (r * k) / 32, c[1] + (g * k) / 32, c[2] + (b * k) / 32];
}

function getNear(r: number, g: number, b: number) {
  let ind = 0;
  let err = getErr(r, g, b, curPal[0]);
  for (let i = 1; i < curPal.length; i++) {
    const cur = getErr(r, g, b, curPal[i]);
    if (cur < err) {
      err = cur;
      ind = i;
    }
  }
  return ind;
}

function procImg(sourceImage: ImageData) {
  const paperW = 800;
  const paperH = 480;

  const { width: sW, height: sH } = sourceImage;
  const destImage = new ImageData(paperW, paperH); // redrawing the image

  const dX = 0; // offset
  const dY = 0;

  const dW = paperW;
  const dH = paperH;

  if (sW < 3 || sH < 3) {
    throw 'Image is too small';
  }

  let index = 0;
  const pSrc = sourceImage;
  const pDst = destImage;

  let aInd = 0;
  let bInd = 1;

  const errArr = new Array(2);

  errArr[0] = new Array(dW);
  errArr[1] = new Array(dW);

  for (let i = 0; i < dW; i++) errArr[bInd][i] = [0, 0, 0];
  for (let j = 0; j < dH; j++) {
    const y = dY + j;
    if (y < 0 || y >= sH) {
      for (let i = 0; i < dW; i++, index += 4)
        setVal(pDst, index, (i + j) % 2 == 0 ? 1 : 0);
      continue;
    }
    aInd = ((bInd = aInd) + 1) & 1;
    for (let i = 0; i < dW; i++) errArr[bInd][i] = [0, 0, 0];
    for (let i = 0; i < dW; i++) {
      const x = dX + i;
      if (x < 0 || x >= sW) {
        setVal(pDst, index, (i + j) % 2 == 0 ? 1 : 0);
        index += 4;
        continue;
      }
      const pos = (y * sW + x) * 4;
      const old = errArr[aInd][i];
      let r = pSrc.data[pos] + old[0];
      let g = pSrc.data[pos + 1] + old[1];
      let b = pSrc.data[pos + 2] + old[2];
      const colVal = curPal[getNear(r, g, b)];

      pDst.data[index++] = colVal[0];
      pDst.data[index++] = colVal[1];
      pDst.data[index++] = colVal[2];
      pDst.data[index++] = 255;
      r = r - colVal[0];
      g = g - colVal[1];
      b = b - colVal[2];
      if (i == 0) {
        errArr[bInd][i] = addVal(errArr[bInd][i], r, g, b, 7.0);
        errArr[bInd][i + 1] = addVal(errArr[bInd][i + 1], r, g, b, 2.0);
        errArr[aInd][i + 1] = addVal(errArr[aInd][i + 1], r, g, b, 7.0);
      } else if (i == dW - 1) {
        errArr[bInd][i - 1] = addVal(errArr[bInd][i - 1], r, g, b, 7.0);
        errArr[bInd][i] = addVal(errArr[bInd][i], r, g, b, 9.0);
      } else {
        errArr[bInd][i - 1] = addVal(errArr[bInd][i - 1], r, g, b, 3.0);
        errArr[bInd][i] = addVal(errArr[bInd][i], r, g, b, 5.0);
        errArr[bInd][i + 1] = addVal(errArr[bInd][i + 1], r, g, b, 1.0);
        errArr[aInd][i + 1] = addVal(errArr[aInd][i + 1], r, g, b, 7.0);
      }
    }
  }

  let i = 0;
  const arr = new Array(paperH * paperW);

  for (let y = 0; y < paperH; y++)
    for (let x = 0; x < paperW; x++, i++) {
      arr[i] = getVal(pDst, i << 2);
    }

  return toEinkFormat(arr);
}
