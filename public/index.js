window.onload = () => {
  // betölti egy megadott ID-val rendelkező tantárgy kurzus, szeminárium és labor óráinak a számát és megjeleníti azokat
  async function loadSubjectDetails(subjID) {
    try {
      console.log(`LOG: Adatok lekérése a ${subjID} tárgyhoz`);

      // meghívom a HTTP kérést
      const resp = await fetch(`/subject/${subjID}/info`, {
        method: 'GET', // ez az alapértelmezett, de gyakorlat kedvéért
      });

      // ha hibába ütközünk, akkor baj van :)
      if (!resp.ok) {
        throw new Error(`HTTP hiba! ${resp.status} error`);
      }

      // "átveszem" a HTTP kérés válaszát
      const data = await resp.json();

      const originalRow = document.getElementById(`row-${subjID}`);
      let detailsRow = document.getElementById(`details-${subjID}`);

      // ha már létezik a mező, akkor nem csinálunk semmit
      if (!detailsRow) {
        // ellenkező ezetben létrehozok egy új sort az adatokkal
        detailsRow = document.createElement('tr');
        detailsRow.id = `details-${subjID}`;

        const td = document.createElement('td');
        td.colSpan = 4;
        td.style.textAlign = 'center';

        td.textContent = `Kurzus: ${data.KurzusNr} | Szeminárium: ${data.SzemiNr} | Labor: ${data.LaborNr}`;

        detailsRow.appendChild(td);
        originalRow.parentNode.insertBefore(detailsRow, originalRow.nextSibling);
      }
    } catch (e) {
      console.log('LOG: Hiba történt', e);
      alert('Hiba történt a betöltéskor');
    }
  }

  // minden tantárgykódnak adok egy eventlister-ert, amelyre kattintáskor meghívom az aszinkron függvényt, amelyik betölti a tantárgy adatait
  const subjectCells = document.querySelectorAll('.clickable');
  subjectCells.forEach((cell) => {
    cell.addEventListener('click', () => {
      // a data-* attributummal HTML objektumokba extra infokat tudok tárolni, ezzel megkönnyítem minden gombra való hívatkozást
      const id = cell.getAttribute('data-id');
      loadSubjectDetails(id);
    });
  });

  // törli egy megadott file-t, filenév alapján (a filenevek egyediek)
  async function deleteFile(filename, subjID, buttonElement) {
    try {
      console.log(`LOG: Kérés érkezett, hogy töröljük ${filename} file-t\n`);

      // HTTP hívás, amelyik elvégzi a backend (AB-ból) való törlést
      const resp = await fetch(`/subject/${subjID}/delete/${filename}`, {
        method: 'DELETE',
      });

      // ellenőrizzük, ha sikeres volt
      if (!resp.ok) {
        throw new Error(`HTTP hiba! ${resp.status} error`);
      }

      // ha sikeres volt, akkor törlöm lekérem annak a sornak az objektumát, amelyikben a gomb szerepelt és ezt törlöm a táblázatból
      const result = await resp.json();
      if (result.success) {
        const row = buttonElement.closest('tr');
        row.remove();
        alert('A file sikeresen törölve');
      }
    } catch (err) {
      console.log('LOG: Hiba történt a törléskor', err);
      alert('Hiba történt a file törlésekor');
    }
  }

  // minden gombra eventlisten-ert rak
  const deleteBtns = document.querySelectorAll('.delete-file');
  deleteBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filename = btn.getAttribute('data-filename');
      // a data-* attributummal HTML objektumokba extra infokat tudok tárolni, ezzel megkönnyítem minden gombra való hívatkozást
      const subjID = btn.getAttribute('data-id');
      deleteFile(filename, subjID, btn);
    });
  });
};
