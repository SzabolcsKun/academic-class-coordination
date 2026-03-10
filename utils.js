import path from 'path';
import crypto from 'crypto';

// file nevenek "tisztitasa" szurese
export function clearName(name) {
  return name
    .replace(/\.[^.]+$/u, '') // levagja a kiterjesztest
    .replace(/[^\w\- ]+/gu, '') // csak alfanumerikus karakterek, -, _ es ' ' maradjon
    .replace(/\s+/gu, '_'); // ' ' helyett _ lesz
}

// idobelyeg kiszamitasa
export function timeStamping() {
  const d = new Date();

  const date = d.getDate();
  const time = d.getTime();

  return `${date}_${time}`;
}

// eltarolt file nev letrehozasa
export function makeFileName(originalname) {
  const ext = path.extname(originalname);
  const name = clearName(originalname);
  // const timeStamp = timeStamping();

  // random generál egy 32 karakterből álló string-et, így elkerülve a duplikátomokat a file neveinél
  const uniqueSuffix = crypto.randomBytes(16).toString('hex');

  return `${name}_${uniqueSuffix}${ext}`;
}

export function validateUpload(req) {
  if (!req.params.id) {
    const err = new Error('Hiányzik az egyedi kód');
    err.status = 400;
    throw err;
  }

  if (!req.files || req.files.length === 0) {
    const err = new Error('Nincsenek feltöltött file-ok');
    err.status = 400;
    throw err;
  }
}
