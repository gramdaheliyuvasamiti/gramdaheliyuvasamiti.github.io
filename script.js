/* =====================================================
   GRAM DAHELI YUVA SAMITI
   ADMIN + PHOTO + DOCUMENT SYSTEM
===================================================== */


/* =====================================================
   ADMIN PASSWORD
===================================================== */

/*
   अपना password यहाँ बदल सकते हो।

   अभी password:
   Daheli@2026
*/

const ADMIN_PASSWORD = "Daheli@2026";

let isAdmin = sessionStorage.getItem("daheliAdmin") === "true";


/* =====================================================
   LOCAL STORAGE
===================================================== */

let photos =
  JSON.parse(localStorage.getItem("daheliPhotos")) || [];

let documents =
  JSON.parse(localStorage.getItem("daheliDocuments")) || [];

let income =
  JSON.parse(localStorage.getItem("daheliIncome")) || [];

let expenses =
  JSON.parse(localStorage.getItem("daheliExpenses")) || [];


/* =====================================================
   MOBILE MENU
===================================================== */

const menuToggle =
  document.getElementById("menuToggle");

const mainNav =
  document.getElementById("mainNav");

if (menuToggle) {

  menuToggle.addEventListener("click", function () {

    mainNav.classList.toggle("show");

  });

}


/* =====================================================
   DROPDOWN MENU
===================================================== */

const dropdowns =
  document.querySelectorAll(".dropdown");

dropdowns.forEach(function (dropdown) {

  const button =
    dropdown.querySelector(".dropbtn");

  button.addEventListener("click", function (event) {

    event.stopPropagation();

    dropdowns.forEach(function (other) {

      if (other !== dropdown) {
        other.classList.remove("open");
      }

    });

    dropdown.classList.toggle("open");

  });

});


document.addEventListener("click", function () {

  dropdowns.forEach(function (dropdown) {

    dropdown.classList.remove("open");

  });

});


/* =====================================================
   CLOSE MOBILE MENU AFTER CLICK
===================================================== */

document.querySelectorAll(".nav a").forEach(function (link) {

  link.addEventListener("click", function () {

    if (mainNav) {
      mainNav.classList.remove("show");
    }

  });

});


/* =====================================================
   ADMIN LOGIN
===================================================== */

const loginBtn =
  document.getElementById("loginBtn");

const adminPassword =
  document.getElementById("adminPassword");

const loginMessage =
  document.getElementById("loginMessage");

const adminLogin =
  document.getElementById("adminLogin");

const adminPanel =
  document.getElementById("adminPanel");

const logoutBtn =
  document.getElementById("logoutBtn");


function updateAdminUI() {

  const galleryAdminBox =
    document.getElementById("galleryAdminBox");

  const documentsUploadPanel =
    document.getElementById("documentsUploadPanel");

  const incomeUploadPanel =
    document.getElementById("incomeUploadPanel");

  const expensesUploadPanel =
    document.getElementById("expensesUploadPanel");

  if (isAdmin) {

    if (adminLogin) {
      adminLogin.style.display = "none";
    }

    if (adminPanel) {
      adminPanel.style.display = "block";
    }

    if (galleryAdminBox) {
      galleryAdminBox.style.display = "block";
    }

    if (documentsUploadPanel) {
      documentsUploadPanel.style.display = "block";
    }

    if (incomeUploadPanel) {
      incomeUploadPanel.style.display = "block";
    }

    if (expensesUploadPanel) {
      expensesUploadPanel.style.display = "block";
    }

    document.body.classList.add("admin-mode");

  } else {

    if (adminLogin) {
      adminLogin.style.display = "block";
    }

    if (adminPanel) {
      adminPanel.style.display = "none";
    }

    if (galleryAdminBox) {
      galleryAdminBox.style.display = "none";
    }

    if (documentsUploadPanel) {
      documentsUploadPanel.style.display = "none";
    }

    if (incomeUploadPanel) {
      incomeUploadPanel.style.display = "none";
    }

    if (expensesUploadPanel) {
      expensesUploadPanel.style.display = "none";
    }

    document.body.classList.remove("admin-mode");
  }

  renderPhotos();
  renderFiles("documents");
  renderFiles("income");
  renderFiles("expenses");
}

if (loginBtn) {

  loginBtn.addEventListener("click", function () {

    const password =
      adminPassword.value.trim();

    if (password === ADMIN_PASSWORD) {

      isAdmin = true;

      sessionStorage.setItem(
        "daheliAdmin",
        "true"
      );

      loginMessage.textContent =
        "✅ Login सफल हुआ।";

      loginMessage.style.color =
        "#28633b";

      adminPassword.value = "";

      updateAdminUI();

    } else {

      loginMessage.textContent =
        "❌ Admin Password गलत है।";

      loginMessage.style.color =
        "#a94442";

    }

  });

}


/* =====================================================
   ENTER KEY LOGIN
===================================================== */

if (adminPassword) {

  adminPassword.addEventListener("keydown", function (event) {

    if (event.key === "Enter") {

      loginBtn.click();

    }

  });

}


/* =====================================================
   LOGOUT
===================================================== */

if (logoutBtn) {

  logoutBtn.addEventListener("click", function () {

    isAdmin = false;

    sessionStorage.removeItem(
      "daheliAdmin"
    );

    updateAdminUI();

    window.location.hash = "admin";

  });

}


/* =====================================================
   CREATE ID
===================================================== */

function createId() {

  return Date.now().toString()
    + Math.random().toString(36).substring(2);

}


/* =====================================================
   PHOTO UPLOAD
===================================================== */

const galleryInput =
  document.getElementById("galleryInput");

const galleryUploadBtn =
  document.getElementById("galleryUploadBtn");


if (galleryUploadBtn) {

  galleryUploadBtn.addEventListener("click", function () {

    if (!isAdmin) {

      alert(
        "🔐 केवल Admin ही फोटो Upload कर सकता है।"
      );

      window.location.hash = "admin";

      return;

    }

    const files =
      galleryInput.files;

    if (!files || files.length === 0) {

      alert("कृपया फोटो चुनें।");

      return;

    }


    let pending =
      files.length;


    Array.from(files).forEach(function (file) {

      if (!file.type.startsWith("image/")) {

        pending--;

        return;

      }


      const reader =
        new FileReader();


      reader.onload = function (event) {

        photos.push({

          id: createId(),

          name: file.name,

          data: event.target.result,

          date: new Date().toLocaleString("hi-IN")

        });


        pending--;


        if (pending === 0) {

          localStorage.setItem(
            "daheliPhotos",
            JSON.stringify(photos)
          );

          galleryInput.value = "";

          renderPhotos();

          alert(
            "✅ फोटो सफलतापूर्वक Upload हो गई।"
          );

        }

      };


      reader.readAsDataURL(file);

    });

  });

}


/* =====================================================
   RENDER PHOTOS
===================================================== */

function renderPhotos() {

  const gallery =
    document.getElementById("photoGallery");

  if (!gallery) {
    return;
  }


  gallery.innerHTML = "";


  if (photos.length === 0) {

    gallery.innerHTML = `
      <p class="no-photo">
        अभी कोई फोटो उपलब्ध नहीं है।
      </p>
    `;

    return;

  }


  photos.forEach(function (photo) {

    const card =
      document.createElement("div");

    card.className =
      "photo-card";


    let deleteButton = "";


    if (isAdmin) {

      deleteButton = `
        <button
          class="photo-delete"
          onclick="deletePhoto('${photo.id}')">
          🗑️ Delete
        </button>
      `;

    }


    card.innerHTML = `

      <img
        src="${photo.data}"
        alt="${escapeHTML(photo.name)}">

      <div class="photo-info">

        
        ${deleteButton}

      </div>

    `;


    gallery.appendChild(card);

  });

}


/* =====================================================
   DELETE PHOTO
===================================================== */

function deletePhoto(id) {

  if (!isAdmin) {

    alert(
      "🔐 केवल Admin ही फोटो Delete कर सकता है।"
    );

    return;

  }


  const confirmDelete =
    confirm(
      "क्या आप यह फोटो Delete करना चाहते हैं?"
    );


  if (!confirmDelete) {
    return;
  }


  photos =
    photos.filter(function (photo) {

      return photo.id !== id;

    });


  localStorage.setItem(
    "daheliPhotos",
    JSON.stringify(photos)
  );


  renderPhotos();

}


/* =====================================================
   DOCUMENT UPLOAD BUTTONS
===================================================== */

setupFileUpload(
  "documents",
  "documentsInput",
  "documentsUploadBtn"
);

setupFileUpload(
  "income",
  "incomeInput",
  "incomeUploadBtn"
);

setupFileUpload(
  "expenses",
  "expensesInput",
  "expensesUploadBtn"
);


/* =====================================================
   FILE UPLOAD FUNCTION
===================================================== */

function setupFileUpload(
  category,
  inputId,
  buttonId
) {

  const input =
    document.getElementById(inputId);

  const button =
    document.getElementById(buttonId);


  if (!input || !button) {
    return;
  }


  button.addEventListener("click", function () {

    if (!isAdmin) {

      alert(
        "🔐 केवल Admin ही document Upload कर सकता है।"
      );

      window.location.hash = "admin";

      return;

    }


    const file =
      input.files[0];


    if (!file) {

      alert(
        "कृपया पहले document चुनें।"
      );

      return;

    }


    const reader =
      new FileReader();


    reader.onload = function (event) {


      const newFile = {

        id: createId(),

        name: file.name,

        type: file.type,

        size: file.size,

        data: event.target.result,

        date: new Date().toLocaleString("hi-IN")

      };


      if (category === "documents") {

        documents.push(newFile);

        localStorage.setItem(
          "daheliDocuments",
          JSON.stringify(documents)
        );

      }


      if (category === "income") {

        income.push(newFile);

        localStorage.setItem(
          "daheliIncome",
          JSON.stringify(income)
        );

      }


      if (category === "expenses") {

        expenses.push(newFile);

        localStorage.setItem(
          "daheliExpenses",
          JSON.stringify(expenses)
        );

      }


      input.value = "";


      renderFiles(category);


      alert(
        "✅ Document सफलतापूर्वक Upload हो गया।"
      );

    };


    reader.readAsDataURL(file);

  });

}


/* =====================================================
   GET FILE ARRAY
===================================================== */

function getFiles(category) {

  if (category === "documents") {
    return documents;
  }

  if (category === "income") {
    return income;
  }

  if (category === "expenses") {
    return expenses;
  }

  return [];

}


/* =====================================================
   RENDER FILES
===================================================== */

function renderFiles(category) {

  let listId = "";


  if (category === "documents") {
    listId = "documentsList";
  }

  if (category === "income") {
    listId = "incomeList";
  }

  if (category === "expenses") {
    listId = "expensesList";
  }


  const list =
    document.getElementById(listId);


  if (!list) {
    return;
  }


  const files =
    getFiles(category);


  list.innerHTML = "";


  if (files.length === 0) {

    list.innerHTML = `
      <p class="no-document">
        अभी कोई document उपलब्ध नहीं है।
      </p>
    `;

    return;

  }


  files.forEach(function (file) {

    const item =
      document.createElement("div");

    item.className =
      "file-item";


    let deleteButton = "";


    if (isAdmin) {

      deleteButton = `
        <button
          class="delete-btn"
          onclick="deleteFile('${category}', '${file.id}')">
          🗑️ Delete
        </button>
      `;

    }


    item.innerHTML = `

      <div>

        <div class="file-name">
          📄 ${escapeHTML(file.name)}
        </div>

        <div class="file-type">
          ${file.date || ""}
        </div>

      </div>


      <div class="file-actions">

        <a
          class="download-btn"
          href="${file.data}"
          download="${escapeHTML(file.name)}">

          📥 Download

        </a>

        ${deleteButton}

      </div>

    `;


    list.appendChild(item);

  });

}


/* =====================================================
   DELETE FILE
===================================================== */

function deleteFile(category, id) {

  if (!isAdmin) {

    alert(
      "🔐 केवल Admin ही document Delete कर सकता है।"
    );

    return;

  }


  if (!confirm(
    "क्या आप यह document Delete करना चाहते हैं?"
  )) {

    return;

  }


  if (category === "documents") {

    documents =
      documents.filter(function (file) {

        return file.id !== id;

      });


    localStorage.setItem(
      "daheliDocuments",
      JSON.stringify(documents)
    );

  }


  if (category === "income") {

    income =
      income.filter(function (file) {

        return file.id !== id;

      });


    localStorage.setItem(
      "daheliIncome",
      JSON.stringify(income)
    );

  }


  if (category === "expenses") {

    expenses =
      expenses.filter(function (file) {

        return file.id !== id;

      });


    localStorage.setItem(
      "daheliExpenses",
      JSON.stringify(expenses)
    );

  }


  renderFiles(category);

}


/* =====================================================
   HTML ESCAPE
===================================================== */

function escapeHTML(text) {

  const div =
    document.createElement("div");

  div.textContent =
    text;

  return div.innerHTML;

}


/* =====================================================
   START
===================================================== */

updateAdminUI();