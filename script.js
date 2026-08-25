const SUPABASE_URL = "https://cmhfmlvxgtwqzbhpjvdx.supabase.co";

const SUPABASE_KEY = "sb_publishable_7cKvIjO6LXkpnFmGj8VaHA_fHQKNsui";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);
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
const DOWNLOAD_PASSWORD = "Member@2026";

function secureDownload(url) {
  const pass = prompt("📥 Enter Password ");

  if (pass === DOWNLOAD_PASSWORD) {
    window.open(url);
  } else {
    alert("❌ Wrong Password");
  }
}

let isAdmin = sessionStorage.getItem("daheliAdmin") === "true";


/* =====================================================
   LOCAL STORAGE
===================================================== */


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

  loadGallery();
console.log("Supabase Connected");
console.log(supabaseClient);
renderFiles("Samiti Documents");
renderFiles("Incoming Payment");
renderFiles("Expenses");
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


/* =====================================================
   RENDER PHOTOS
===================================================== */


/* =====================================================
   DELETE PHOTO
===================================================== */

/* =====================================================
   SUPABASE PHOTO GALLERY
===================================================== */

async function loadGallery() {

  const gallery =
    document.getElementById("photoGallery");

  if (!gallery) return;

  gallery.innerHTML = "<p>Loading...</p>";

  const { data, error } =
    await supabaseClient.storage
      .from("Photo Gallery")
      .list("", { limit: 100 });

  if (error) {

    console.error(error);

    gallery.innerHTML =
      "<p>Gallery Load Failed</p>";

    return;
  }

  gallery.innerHTML = "";

  if (data.length === 0) {

    gallery.innerHTML =
      "<p>अभी कोई फोटो उपलब्ध नहीं है।</p>";

    return;
  }

  data.forEach(file => {

    const { data: urlData } =
      supabaseClient.storage
        .from("Photo Gallery")
        .getPublicUrl(file.name);
   console.log(file.name);
   console.log(urlData.publicUrl);

    const card =
      document.createElement("div");

    card.className = "photo-card";

    card.innerHTML = `
      <img
        src="${urlData.publicUrl}"
        alt="${file.name}">

      ${
        isAdmin
          ? `
          <button
            class="photo-delete"
            onclick="deletePhoto('${file.name}')">
            🗑️ Delete
          </button>
          `
          : ""
      }
    `;

    gallery.appendChild(card);

  });

}

const galleryInput =
  document.getElementById("galleryInput");

const galleryUploadBtn =
  document.getElementById("galleryUploadBtn");

if (galleryUploadBtn) {

  galleryUploadBtn.addEventListener(
    "click",
    async function () {

      if (!isAdmin) {

        alert(
          "🔐 केवल Admin ही फोटो Upload कर सकता है।"
        );

        return;
      }

      const files =
        galleryInput.files;

      if (!files.length) {

        alert("फोटो चुनें");

        return;
      }

    for (const file of files) {

  const extension = file.name.split('.').pop();

const baseName = file.name.replace(/\.[^/.]+$/, '');

const fileName =
  Date.now() + "_" +
  encodeURIComponent(baseName) +
  "." + extension;

  const { error } =
    await supabaseClient.storage
      .from("Photo Gallery")
      .upload(fileName, file);

        if (error) {

          console.error(error);

          alert(error.message);

          return;
        }

      }

      galleryInput.value = "";

      await loadGallery();

      alert(
        "✅ फोटो सफलतापूर्वक Upload हो गई।"
      );

    }
  );

}

async function deletePhoto(fileName) {

  if (!isAdmin) return;

  if (
    !confirm(
      "क्या आप यह फोटो Delete करना चाहते हैं?"
    )
  ) {
    return;
  }

  const { error } =
    await supabaseClient.storage
      .from("Photo Gallery")
      .remove([fileName]);

  if (error) {

    alert(error.message);

    return;
  }

  await loadGallery();

}

/* =====================================================
   DOCUMENT UPLOAD BUTTONS
===================================================== */
setupFileUpload(
  "Samiti Documents",
  "documentsInput",
  "documentsUploadBtn"
);

setupFileUpload(
  "Incoming Payment",
  "incomeInput",
  "incomeUploadBtn"
);

setupFileUpload(
  "Expenses",
  "expensesInput",
  "expensesUploadBtn"
);


/* =====================================================
   FILE UPLOAD FUNCTION
===================================================== */

async function setupFileUpload(
  category,
  inputId,
  buttonId
) {

  const input = document.getElementById(inputId);
  const button = document.getElementById(buttonId);

  if (!input || !button) return;

  button.addEventListener("click", async function () {

    if (!isAdmin) {
      alert("🔐 केवल Admin ही Upload कर सकता है।");
      return;
    }

    const file = input.files[0];

    if (!file) {
      alert("कृपया file चुनें।");
      return;
    }
  
const extension = file.name.split('.').pop();

const baseName = file.name.replace(/\.[^/.]+$/, '');

const fileName =
  Date.now() + "_" +
  encodeURIComponent(baseName) +
  "." + extension;

    const { error } =
      await supabaseClient.storage
        .from(category)
        .upload(fileName, file);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    input.value = "";

    await renderFiles(category);

    alert("✅ Upload Successful");
  });

}




/* =====================================================
   GET FILE ARRAY
===================================================== */


/* =====================================================
   RENDER FILES
===================================================== */

async function renderFiles(category) {

  let listId = "";

  if (category === "Samiti Documents") listId = "documentsList";
if (category === "Incoming Payment") listId = "incomeList";
if (category === "Expenses") listId = "expensesList";

  const list = document.getElementById(listId);

  if (!list) return;

  const { data: files, error } =
    await supabaseClient.storage
      .from(category)
      .list("", { limit: 100 });

  console.log("Bucket:", category);
 console.log("Files:", files);
 console.log("Error:", error);

  if (error) {
    console.error(error);
    return;
  }

  list.innerHTML = "";

  if (files.length === 0) {
    list.innerHTML =
      "<p class='no-document'>अभी कोई document उपलब्ध नहीं है।</p>";
    return;
  }

  files.forEach((file) => {

    const { data: urlData } =
      supabaseClient.storage
        .from(category)
        .getPublicUrl(file.name);

    const item = document.createElement("div");

    item.className = "file-item";

    item.innerHTML = `
     <span>${decodeURIComponent(file.name.replace(/^\d+_/, ''))}</span>

 <a
 class="download-btn"
 href="#"
 onclick="secureDownload('${urlData.publicUrl}'); return false;">
 📥 Download
</a>

      ${
        isAdmin
          ? `
          <button
            class="delete-btn"
            onclick="deleteFile('${category}','${file.name}')">
            🗑️ Delete
          </button>
          `
          : ""
      }
    `;

    list.appendChild(item);

  });

}

  


/* =====================================================
   DELETE FILE
===================================================== */

async function deleteFile(category, fileName) {

  if (!isAdmin) return;

  if (!confirm("क्या आप यह file Delete करना चाहते हैं?")) {
    return;
  }

  const { error } =
    await supabaseClient.storage
      .from(category)
      .remove([fileName]);

  if (error) {
    alert(error.message);
    return;
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
loadGallery();
renderFiles("Samiti Documents");
renderFiles("Incoming Payment");
renderFiles("Expenses");

