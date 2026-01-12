const grid = document.getElementById("cats-grid");
const overlay = document.getElementById("modal-overlay");
const btns = document.querySelectorAll(".filter-btn");
let catsData = [];

// --- 1. SETUP SUPABASE ---
const SUPABASE_URL = "https://xjaixlmbqnuzkfywbshi.supabase.co";
const SUPABASE_KEY =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqYWl4bG1icW51emtmeXdic2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNzUyOTksImV4cCI6MjA4MzY1MTI5OX0.vJC9a_asScFHYEZVw1rm6PtisLMGRMKXt53N-OucPtE";

// Safety check for library
var supabase;
if (typeof window.supabase !== "undefined") {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
  console.error("Supabase SDK not loaded.");
  grid.innerHTML =
    '<p style="text-align:center;">Unable to load content. Please refresh the page.</p>';
}

// --- 2. FETCH DATA ---
async function fetchCats() {
  if (!supabase) return;

  // Show a clean loading message
  grid.innerHTML =
    '<p style="text-align:center; width:100%; color:#666;">Loading our furry friends...</p>';

  try {
    const { data, error } = await supabase
      .from("cats")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Database Error:", error);
      grid.innerHTML =
        '<p style="text-align:center; width:100%;">Sorry, we couldn\'t load the cats right now.</p>';
      return;
    }

    if (!data || data.length === 0) {
      grid.innerHTML =
        '<p style="text-align:center; width:100%;">No cats found yet. Check back soon!</p>';
      return;
    }

    // Success!
    catsData = data;
    renderCards("all");
  } catch (err) {
    console.error("Unexpected Error:", err);
    grid.innerHTML =
      '<p style="text-align:center; width:100%;">Something went wrong. Please check your connection.</p>';
  }
}

// --- FETCH MENU IMAGE ---
async function fetchMenuImage() {
  if (!supabase) return;

  try {
    // Fetch the URL from the 'site_settings' table
    const { data, error } = await supabase
      .from("site_settings")
      .select("setting_value")
      .eq("setting_name", "menu_image_url") // Looks for the specific row
      .single();

    if (error) {
      console.error("Error fetching menu image:", error);
      return;
    }

    if (data && data.setting_value) {
      const menuImg = document.getElementById("dynamic-menu-image");

      // We add ?t=... to the end of the URL.
      // This forces the browser to ignore its cache and always load the newest image.
      const timestamp = new Date().getTime();
      menuImg.src = `${data.setting_value}?t=${timestamp}`;
    }
  } catch (err) {
    console.error("Unexpected error loading menu:", err);
  }
}

// --- NEW: FETCH HERO IMAGE ---
async function fetchHeroImage() {
  if (!supabase) return;

  try {
      const { data, error } = await supabase
          .from('site_settings')
          .select('setting_value')
          .eq('setting_name', 'hero_image_url')
          .single();

      if (error) {
          console.error('Error fetching hero image:', error);
          // Optional: Set a fallback image if DB fails
          // document.querySelector('.hero').style.backgroundImage = "linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('FALLBACK_URL_HERE')";
          return;
      }

      if (data && data.setting_value) {
          const heroSection = document.querySelector('.hero');
          // We must re-add the linear gradient in JS along with the new URL
          heroSection.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${data.setting_value}')`;
      }
  } catch (err) {
      console.error('Unexpected error loading hero:', err);
  }
}

// --- 3. RENDER LOGIC ---
function renderCards(filterType) {
  grid.innerHTML = "";

  const filteredCats =
    filterType === "all"
      ? catsData
      : catsData.filter((cat) => cat.status === filterType);

  if (filteredCats.length === 0) {
    grid.innerHTML =
      '<p style="text-align:center; width:100%;">No cats found in this category.</p>';
    return;
  }

  filteredCats.forEach((cat) => {
    let badgeClass = "";
    let statusText = "";

    if (cat.status === "adoptable") {
      badgeClass = "status-adoptable";
      statusText = "Looking For a New Home";
    } else if (cat.status === "resident") {
      badgeClass = "status-resident";
      statusText = "Forever a Bast Resident";
    } else {
      badgeClass = "status-adopted";
      statusText = "Already Home";
    }

    const card = document.createElement("div");
    card.className = "cat-card";
    card.onclick = () => openModal(cat.id);

    card.innerHTML = `
            <div class="cat-img-container">
                <img src="${cat.image}" alt="${cat.name}">
                <div class="status-badge ${badgeClass}">${statusText}</div>
            </div>
            <div class="cat-info">
                <h3 class="cat-name">${cat.name}</h3>
                <p class="cat-story">${cat.shortDesc}</p>
                <a href="javascript:void(0)" class="read-story">READ STORY →</a>
            </div>
        `;
    grid.appendChild(card);
  });
}

function filterCats(type) {
  btns.forEach((btn) => btn.classList.remove("active"));
  event.target.classList.add("active");
  renderCards(type);
}

// --- 4. MODAL LOGIC ---
function openModal(id) {
  const cat = catsData.find((c) => c.id === id);
  if (!cat) return;

  const mainImg = document.getElementById("modal-main-img");
  mainImg.src = cat.image;
  document.getElementById("modal-name").innerText = cat.name;
  document.getElementById("modal-desc").innerText = cat.fullDesc;

  const tagEl = document.getElementById("modal-tag");
  let statusText = "";

  if (cat.status === "adoptable") {
    tagEl.style.backgroundColor = "var(--success-color)";
    statusText = "Looking For a New Home";
  } else if (cat.status === "resident") {
    tagEl.style.backgroundColor = "var(--accent-color)";
    statusText = "Forever a Bast Resident";
  } else {
    tagEl.style.backgroundColor = "var(--muted-color)";
    statusText = "Already Home";
  }
  tagEl.innerText = statusText;

  const galleryGrid = document.getElementById("modal-gallery");
  galleryGrid.innerHTML = "";

  const allImages = [cat.image];
  if (cat.moreImages && Array.isArray(cat.moreImages)) {
    allImages.push(...cat.moreImages);
  }

  allImages.forEach((imgUrl) => {
    const thumb = document.createElement("img");
    thumb.src = imgUrl;
    thumb.className = "gallery-thumb";

    if (imgUrl === mainImg.src) thumb.classList.add("active");

    thumb.onclick = function () {
      mainImg.src = imgUrl;
      document
        .querySelectorAll(".gallery-thumb")
        .forEach((t) => t.classList.remove("active"));
      thumb.classList.add("active");
    };
    galleryGrid.appendChild(thumb);
  });

  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  overlay.classList.remove("open");
  document.body.style.overflow = "auto";
}

overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeModal();
});

// --- 5. MENU MODAL ---
const menuLink = document.getElementById("menu-link");
const menuOverlay = document.getElementById("menu-modal-overlay");

function openMenuModal() {
  menuOverlay.classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeMenuModal() {
  menuOverlay.classList.remove("open");
  document.body.style.overflow = "auto";
}

menuLink.addEventListener("click", (e) => {
  e.preventDefault();
  openMenuModal();
});
menuOverlay.addEventListener("click", (e) => {
  if (e.target === menuOverlay) closeMenuModal();
});

// --- START APP ---

fetchCats();
fetchMenuImage(); 
fetchHeroImage();