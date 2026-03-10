import sql from 'mssql';

// csatlakozas beallitasai
const config = {
  server: 'localhost',
  database: 'WebProg',
  user: 'Szabi',
  password: 'ksim2463',
  options: {
    trustServerCertificate: true,
  },
};

// connection pool letrehozasa a fenti beallitasokkal
const pool = new sql.ConnectionPool(config);
// pool connect
const poolConnect = pool
  .connect()
  .then(() => console.log('MSSQL pool connected'))
  .catch((err) => {
    console.log('MSSQL pool connection failed', err);
  });

export async function insertSubject({ SubjectID, SubjectName, SubjectGrade, KurzusNr, SzemiNr, LaborNr, OwnerID }) {
  await poolConnect;
  const req = pool.request();
  req.input('id', SubjectID);
  req.input('name', SubjectName);
  req.input('grade', SubjectGrade);
  req.input('kurzus', KurzusNr);
  req.input('szemi', SzemiNr);
  req.input('labor', LaborNr);
  req.input('owner', OwnerID);

  const cmd = `INSERT INTO Subjects (SubjectID, SubjectName, SubjectGrade, KurzusNr, SzemiNr, LaborNr, OwnerID)
  VALUES (@id, @name, @grade, @kurzus, @szemi, @labor, @owner)`;

  await req.query(cmd);
}

export async function insertMaterial({ SubjectID, MaterialName, RelativePath, Size }) {
  await poolConnect;
  const req = pool.request();

  req.input('subject', SubjectID);
  req.input('matname', MaterialName);
  req.input('path', RelativePath);
  req.input('size', Size);

  const cmd = `INSERT INTO Materials (SubjectID, MaterialName, RelativePath, Size)
    VALUES (@subject, @matname, @path, @size)`;

  await req.query(cmd);
}

export async function subjectExists(subjectId) {
  await poolConnect;
  const req = pool.request();
  req.input('subject', subjectId);

  const cmd = `SELECT SubjectID FROM Subjects
    WHERE SubjectID = @subject`;

  const result = await req.query(cmd);
  return result.recordset.length > 0;
}

export async function userExists(UserID) {
  await poolConnect;
  const req = pool.request();

  req.input('userid', UserID);
  const cmd = `SELECT UserID FROM Users WHERE UserID = @userid`;
  const res = await req.query(cmd);

  return res.recordset.length > 0;
}

export async function findApplication(SubjectID, UserID) {
  await poolConnect;
  const req = pool.request();

  req.input('subjectid', SubjectID);
  req.input('userid', UserID);
  const cmd = `SELECT ApplicationID FROM Applications WHERE SubjectID = @subjectid AND UserID = @userid`;
  const res = await req.query(cmd);
  return res.recordset.length > 0;
}

export async function leaveSubject(SubjectID, UserID) {
  await poolConnect;
  const req = pool.request();

  req.input('subjectid', SubjectID);
  req.input('userid', UserID);
  const cmd = `DELETE FROM Applications WHERE SubjectID = @subjectid AND UserID = @userid`;
  await req.query(cmd);
}

export async function joinSubject(SubjectID, UserID) {
  await poolConnect;
  const req = pool.request();

  req.input('subjectid', SubjectID);
  req.input('userid', UserID);
  const cmd = `INSERT INTO Applications (SubjectID, UserID) VALUES (@subjectid, @userid)`;
  await req.query(cmd);
}

export async function getSubjectByID(SubjectID) {
  await poolConnect;
  const req = pool.request();
  req.input('subjectid', SubjectID);

  const cmd = `SELECT * FROM Subjects WHERE SubjectID = @subjectid`;

  const result = await req.query(cmd);
  return result.recordset[0];
}

export async function getMaterialsForOneSubject(SubjectID) {
  await poolConnect;
  const req = pool.request();

  req.input('subjectid', SubjectID);
  const cmd = `SELECT MaterialName, RelativePath, Size FROM Materials WHERE SubjectID = @subjectid`;
  const res = await req.query(cmd);
  return res.recordset;
}

export async function getAllSubjects() {
  await poolConnect;
  const req = pool.request();

  const cmd = `SELECT * FROM Subjects ORDER BY SubjectName`;
  const res = await req.query(cmd);
  return res.recordset;
}

export async function getAllUsers() {
  await poolConnect;
  const req = pool.request();

  const cmd = 'SELECT UserID, FullName FROM Users ORDER BY FullName';
  const res = await req.query(cmd);
  return res.recordset;
}

export async function deleteMaterialByName(MaterialName) {
  await poolConnect;
  const req = pool.request();

  req.input('materialname', MaterialName);
  const selectcmd = `SELECT MaterialID, RelativePath FROM Materials WHERE MaterialName = @materialname`;
  const res = await req.query(selectcmd);

  // elvileg ez nem történhet meg, mivel nem form fogja meghívni, hanem egy biztosan létező file-ra lesz, de just in case, beírom ide
  if (!res.recordset || res.recordset.length === 0) {
    console.log(`LOG: A megadott file ${MaterialName} nem létezik\n`);
    return null;
  }

  const path = res.recordset[0].RelativePath;

  req.input('materialid', res.recordset[0].MaterialID);
  const deletecmd = `DELETE FROM Materials WHERE MaterialID = @materialid`;
  await req.query(deletecmd);

  return path;
}

export async function registerUser(UserID, FullName, Email, Phone, Password) {
  await poolConnect;
  const req = pool.request();

  req.input('UserID', UserID);
  req.input('FullName', FullName);
  req.input('Email', Email);
  req.input('Phone', Phone);
  req.input('PasswordHash', Password);

  try {
    const result = await req.execute('sp_RegisterUser');

    if (result.returnValue === 0) {
      console.log('LOG: A felhasználó sikeresen regisztrálva\n');
      return { success: true, code: 0 };
    }

    console.log('LOG: A felhasználó már létezik\n');
    return { success: false, code: -1 };
  } catch (err) {
    console.log('Hiba történt a felhasználó regisztrálásánál\n', err);
    return { success: false, code: -1, error: err.message };
  }
}

export async function loginUser(UserID) {
  await poolConnect;
  const req = pool.request();
  req.input('UserID', UserID);

  const cmd = `SELECT PasswordHash AS jelszo FROM Users WHERE UserID = @UserID`;
  const res = await req.query(cmd);

  return res.recordset.length > 0 ? res.recordset[0] : null;
}
