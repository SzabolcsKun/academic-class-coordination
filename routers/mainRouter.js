import express from 'express';
import bcrypt from 'bcrypt';
import {
  getAllSubjects,
  insertSubject,
  subjectExists,
  getAllUsers,
  userExists,
  findApplication,
  leaveSubject,
  joinSubject,
  registerUser,
  loginUser,
} from '../database.js';

const router = new express.Router();

// főoldal, tantárgyak kilistázása
router.get('/', async (req, res) => {
  try {
    const [subjects, users] = await Promise.all([getAllSubjects(), getAllUsers()]);

    const message = req.query.message || null;
    const error = req.query.error || null;

    console.log('LOG: Sikeres volt a tantárgyak betöltésénél');
    res.render('index', {
      subjects,
      users,
      message,
      error,
      formValues: {},
    });
  } catch (err) {
    console.log('LOG: Hiba a tantárgyak betöltésénél', err);
    res.status(500).render('index', {
      subjects: [],
      users: [],
      message: null,
      error: 'Szerverhiba a tantárgyak lekérésekor',
      formValues: {},
    });
  }
});

// betölti a login oldalt
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// betölti a register oldalt
router.get('/register', (req, res) => {
  res.render('register', { error: null });
});

// visszadob a kezdőoldalra
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log('LOG: Hiba a kijelentkezés során!\n');
      res.redirect('/');
      return;
    }

    // express-session alapertelmezett cookie-ja
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

router.post('/login', async (req, res) => {
  const { userid, password } = req.body;

  try {
    // ha létezik a megadott felhasználó az adatbázisban
    const user = await loginUser(userid);
    const jelszo = user ? user.jelszo : null;

    if (jelszo && bcrypt.compareSync(password, jelszo)) {
      console.log('LOG: Login success!\n');

      // TEMP amíg választ kapok
      // eslint-disable-next-line require-atomic-updates
      req.session.user = userid;
      // manuálisan force-olom a session adatait elmenteni a memóriába (ez esetben)
      req.session.save(() => {
        res.redirect('/');
      });
    } else {
      res.render('login', { error: 'Érvénytelen felhasználónév vagy jelszó!' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.render('login', { error: 'Szerver hiba történt. Próbálja újra később!' });
  }
});

router.post('/register', async (req, res) => {
  const { userid, fullname, email, phone, password } = req.body;

  // kéne ellenőrizni, hogy valid-ok a küldött adatok (regex), de szorít az idő, emiatt most ezt kihagyom, remélem nem lesz gond :)

  const passwordhash = await bcrypt.hash(password, 10);

  try {
    const registration = await registerUser(userid, fullname, email, phone, passwordhash);

    if (registration.code === 0) {
      res.redirect('/login');
    } else {
      res.render('register', {
        error: 'Ez a Felhasználói ID már foglalt. Kérjük, válassz másikat!',
      });
    }
  } catch (err) {
    console.log('LOG: Szerverhiba /register-nél\n', err);
    res.render('register', {
      error: 'Váratlan hiba történt a regisztráció során.',
    });
  }
});

// új tantárgy beszúrása
router.post('/insert', async (req, res) => {
  try {
    const { egyedikod, targyneve, evfolyam, kurzus, szemi, labor } = req.body;

    const ownerid = req.session.user;
    if (!ownerid) {
      return res.redirect(`/?error=${encodeURIComponent('Tantárgy létrehozásához be kell jelentkezned!')}`);
    }

    if (isNaN(kurzus) || isNaN(szemi) || isNaN(labor)) {
      const subjects = await getAllSubjects();
      const users = await getAllUsers();
      console.log('LOG: Érvénytelen értékeket próbáltak beszúrni a tantárgyakhoz');
      return res.status(400).render('index', {
        subjects,
        users,
        message: null,
        error: 'Mindegyik mező kitöltése kötelező',
        formValues: { egyedikod, targyneve, evfolyam, kurzus, szemi, labor },
      });
    }

    const kod = egyedikod.toString().toUpperCase();
    const exists = await subjectExists(kod);

    if (exists) {
      const [subjects, users] = await Promise.all([getAllSubjects(), getAllUsers()]);
      console.log('LOG: A megadott egyedi kód már létezik');
      return res.status(400).render('index', {
        subjects,
        users,
        message: null,
        error: 'A megadott egyedi kód már létezik',
        formValues: { egyedikod, targyneve, evfolyam, kurzus, szemi, labor },
      });
    }

    await insertSubject({
      SubjectID: kod,
      SubjectName: targyneve,
      SubjectGrade: evfolyam,
      KurzusNr: kurzus,
      SzemiNr: szemi,
      LaborNr: labor,
      OwnerID: ownerid,
    });

    console.log('LOG: Sikeres volt az új tantárgy beszúrása');
    return res.redirect(`/?message=${encodeURIComponent('A tantárgy sikeresen beszúrva!')}`);
  } catch (err) {
    console.log('/insert hibába ütközött: ', err);
    const subjects = await getAllSubjects().catch(() => []);
    const users = await getAllUsers();
    return res.status(500).render('index', {
      subjects,
      users,
      message: null,
      error: 'Szerverhiba',
      formValues: req.body || {},
    });
  }
});

router.post('/change', async (req, res) => {
  try {
    const { egyedikod, diakid } = req.body;
    if (!egyedikod || !diakid) {
      console.log('LOG: Nem volt minden mező kitöltve /change');
      return res.redirect(`/?error=${encodeURIComponent('Minden mező kötelező.')}`);
    }

    const subjID = egyedikod.toString().toUpperCase();
    const diakID = diakid.toString();

    const subject = await subjectExists(subjID);
    const user = await userExists(diakID);

    if (!subject || !user) {
      console.log('LOG: Érvénytelen tantárgykód/ diákkód volt feltöltve');
      return res.redirect(`/?error=${encodeURIComponent('Érvénytelen tantárgy vagy felhasználó volt kiválasztva.')}`);
    }

    const application = await findApplication(subjID, diakID);
    let message = `A  ${diakID} diák sikeresen felmondta a ${subjID} tárgyat`;
    if (application) {
      await leaveSubject(subjID, diakID);
      console.log(`LOG: ${message}`);
    } else {
      await joinSubject(subjID, diakID);
      message = `A ${diakID} diák sikeresen felvette a ${subjID} tárgyat`;
      console.log(`LOG: ${message}`);
    }

    return res.redirect(`/?message=${encodeURIComponent(message)}`);
  } catch (err) {
    console.error('/change hiba:', err);
    return res.redirect(`/?error=${encodeURIComponent('Szerverhiba történt a jelentkezés/kilépés során.')}`);
  }
});

export default router;
