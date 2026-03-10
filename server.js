import express from 'express';
import session from 'express-session';
import path from 'path';
import mainRouter from './routers/mainRouter.js';
import subjectRouter from './routers/subjectRouter.js';

const app = express();

// x-www-form-urlencoded form kérést "értelmezi" a szerver számára, egy objektumot hoz létre, amit a req.body-ban találhatunk meg (extended enegélyezi, hogy egymásba ágyazott objektumokkal is küldeni/ feldolgozni tudjak )
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(path.resolve(), 'public')));
app.use('/uploads', express.static(path.join(path.resolve(), 'uploads')));

// beállítom, hogy sémakat fogok használni, milyen fajtát és, hogy hol találja meg ezeket
app.set('view engine', 'ejs');
app.set('views', path.join(path.resolve(), 'views'));

// app.use(morgan('tiny')) hasonló munkát végez
app.use((req, resp, next) => {
  console.log(`Egy új feltöltés kérelem érkezett ${req.method} ${req.url}`);
  next();
});

app.use(
  session({
    // persze, ide egy environment variable kellene a valós világban, ha biztonságosak akarunk lenni
    secret: 'TheLionDoesnotConcernHimselfWithASecretNow',
    resave: false, // ne minden egyes click esetén mentse el a session-t
    saveUninitialized: false, // csak login esetén hozzunk létre egy session-t
    cookie: {
      secure: false,
      maxAge: 10000, // mennyit tartson egy session (10s)
    },
  }),
);

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// router-ek használata
app.use('/', mainRouter);
app.use('/subject', subjectRouter);

app.listen(8080, () => {
  console.log('A szerver requestre vár a 8080-as porton');
});
