import express from 'express';
import fs from 'node:fs/promises';
import path from 'path';
import multer from 'multer';
import { getSubjectByID, getMaterialsForOneSubject, insertMaterial, deleteMaterialByName } from '../database.js';
import { makeFileName, validateUpload } from '../utils.js';

const router = new express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const rawCode = req.params.id || 'UNKNOWN';
    const code = rawCode.toString().toUpperCase();
    const uploadDir = path.join(path.resolve(), 'uploads', code);

    console.log(`Upload dir: ${uploadDir}`);

    fs.mkdir(uploadDir, { recursive: true });

    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const name = makeFileName(file.originalname);
    cb(null, name);
  },
});

const upload = multer({ storage });

async function saveUploadedFilesToDb(subjID, files) {
  // egy "igéret" tömböt ad vissza, amit utólag egyszerre futtatok le
  // a map egy for ciklus megírását "menti meg", de a funkcionalitása megegyezik
  const tasks = files.map((f) => {
    const relPath = `/uploads/${subjID}/${f.filename}`;
    return insertMaterial({
      SubjectID: subjID,
      MaterialName: f.filename,
      RelativePath: relPath,
      Size: f.size,
    });
  });

  await Promise.all(tasks);
}

// egyetlen id-val rendelkező informaciókat tartalmazzó oldal
router.get('/:id', async (req, res) => {
  try {
    const subjID = req.params.id.toString().toUpperCase();
    const subject = await getSubjectByID(subjID);

    if (!subject) {
      console.log('LOG: A megadott tantárgykód nem létezik');
      return res.status(400).render('subject', {
        subject: null,
        materials: [],
        message: null,
        error: `A megadott tantárgy, ${subjID} nem létezik!`,
        formValues: {},
      });
    }

    const materials = await getMaterialsForOneSubject(subjID);
    const success = req.query.success;
    const message = success ? 'A file-ok sikeresen megjelenítve' : null;
    const error = req.query.error || null;

    console.log('LOG: Sikeres volt a megadott tantárgy adatai betöltése');
    return res.render('subject', {
      subject,
      materials,
      message,
      error,
      formValues: {},
    });
  } catch (err) {
    console.log(`LOG: Hiba a tantárgy részleteinek betöltésénél`, err);
    return res.status(500).render('subject', {
      subject: null,
      materials: [],
      message: null,
      error: 'Hiba történt a részletek megjelenítésénél',
      formValues: {},
    });
  }
});

// file-ok feltöltése egy megadott tantárgyhoz
router.post('/:id/upload', upload.array('files', 20), async (req, res) => {
  const subjID = req.params.id.toString().toUpperCase();
  const uploadPath = path.join(path.resolve(), 'uploads', subjID);

  try {
    validateUpload(req);

    const subject = await getSubjectByID(subjID);
    if (!subject || subject.OwnerID !== req.session.user) {
      console.log(`LOG: ${subjID} tantárgykód nem létezik. A megadott útvonal nem elérhető`);

      await fs.rm(uploadPath, { recursive: true, force: true });

      return res.redirect(
        `/subject/${subjID}?error=${encodeURIComponent('Nincs ilyen tantárgy, a feltöltés sikertelen. / Nincs engedélyed file-okat feltölteni! ')}`,
      );
    }

    await saveUploadedFilesToDb(subjID, req.files);
    return res.redirect(`/subject/${subjID}?success=1`);
  } catch (err) {
    console.log('LOG: Hiba történt a file-ok feltöltésében', err);

    if (req.files && req.files.length > 0) {
      await fs.rm(uploadPath, { recursive: true, force: true });
    }

    const errorMessage = err.message || 'Szerverhiba a feltöltés során';
    return res.redirect(`/subject/${subjID}?error=${encodeURIComponent(errorMessage)}`);
  }
});

// tantárgy adatainak lekérése + json formában küldödnek vissza
router.get('/:id/info', async (req, res) => {
  const subjID = req.params.id.toString().toUpperCase();

  try {
    // lekérem egy tárgy adatait
    const subject = await getSubjectByID(subjID);

    if (!subject) {
      return res.status(404).json({ error: 'Megadott tárgy nem található!' });
    }

    return res.json(subject);
  } catch (e) {
    console.log('LOG: Hiba a tárgy adatai lekérésében', e);
    return res.status(500).json({ error: 'Szerverhiba' });
  }
});

// megadott file törlése, a név alapján (egyedi név)
router.delete('/:id/delete/:filename', async (req, res) => {
  const subjID = req.params.id;
  const filename = req.params.filename;

  try {
    const subject = getSubjectByID(subjID);
    if (!req.session.user || !subject || !subject.OwnerID !== req.session.user)
      return res.status(403).json({ error: 'Nincs engedélyed file-okat törölni!' });

    const relPath = await deleteMaterialByName(filename);

    if (!relPath) {
      return res.status(404).json({ error: 'A file nem található az adatbázisban.' });
    }

    // lekérem a file útvonalát
    const fullPath = path.join(path.resolve(), relPath);

    try {
      await fs.access(fullPath);
      await fs.rm(fullPath);
      console.log(`LOG: File sikeresen törölve: ${filename}`);
    } catch (e) {
      console.log('LOG: A file nem létezik', e);
    }

    return res.json({ success: true, message: 'Sikeres törlés' });
  } catch (err) {
    console.log('LOG: Hiba a file törlésekor', err);
    return res.status(500).json({ error: 'Szerverhiba történt a törlés során.' });
  }
});

export default router;
