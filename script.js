const catsData = [
  {
    id: 1,
    name: "Luna",
    status: "resident",
    statusText: "Forever a Bast Resident",
    image:
      "https://images.unsplash.com/photo-1573865526739-10659fec78a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    shortDesc:
      "Found wandering near Webdieh, Luna was shy at first but now rules the roost.",
    fullDesc:
      "Luna was found wandering near Webdieh. She was shy at first but now rules the roost. She loves to sit on laptops while you work and has the loudest purr in the shop. She is the queen of Bast Space!",
    moreImages: [
      "https://images.unsplash.com/photo-1573865526739-10659fec78a5?ixlib=rb-4.0.3&w=200",
      "https://images.unsplash.com/photo-1513245543132-31f507417b26?ixlib=rb-4.0.3&w=200",
      "https://images.unsplash.com/photo-1561948955-570b270e7c36?ixlib=rb-4.0.3&w=200",
    ],
  },
  {
    id: 2,
    name: "Mishmish",
    status: "resident",
    statusText: "Forever a Bast Resident",
    image:
      "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    shortDesc:
      "Our resident ginger gentleman. Mishmish was rescued by Dr. Maysoun.",
    fullDesc:
      "Our resident ginger gentleman. Mishmish was rescued by Dr. Maysoun and is known for stealing sips of milkshakes when no one is looking. He loves chin scratches and sleeping in the sunny window spot.",
    moreImages: [
      "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?ixlib=rb-4.0.3&w=200",
    ],
  },
  {
    id: 3,
    name: "Shadow",
    status: "adoptable",
    statusText: "Looking For a New Home",
    image:
      "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    shortDesc:
      "A mysterious beauty who loves to observe from the high shelves.",
    fullDesc:
      "A mysterious beauty who loves to observe from the high shelves. Shadow is a testament to the patience of our rescue mission—from a scared stray to a confident queen. She is fully vaccinated and looking for a quiet home.",
    moreImages: [
      "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?ixlib=rb-4.0.3&w=200",
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&w=200",
    ],
  },
  {
    id: 4,
    name: "Olive",
    status: "adopted",
    statusText: "Already Home",
    image:
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    shortDesc:
      "Olive found her forever family last month! She now lives happily in Jabal Amman.",
    fullDesc:
      "Olive was one of our sweetest rescues. She found her forever family last month! She now lives happily in Jabal Amman with two other cat siblings.",
    moreImages: [
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&w=200",
    ],
  },
];

const grid = document.getElementById("cats-grid");
const overlay = document.getElementById("modal-overlay");
const btns = document.querySelectorAll(".filter-btn");

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
    if (cat.status === "adoptable") badgeClass = "status-adoptable";
    else if (cat.status === "resident") badgeClass = "status-resident";
    else badgeClass = "status-adopted";

    const card = document.createElement("div");
    card.className = "cat-card";
    card.onclick = () => openModal(cat.id);

    card.innerHTML = `
                    <div class="cat-img-container">
                        <img src="${cat.image}" alt="${cat.name}">
                        <div class="status-badge ${badgeClass}">${cat.statusText}</div>
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

// --- CAT MODAL LOGIC ---
function openModal(id) {
  const cat = catsData.find((c) => c.id === id);
  if (!cat) return;

  const mainImg = document.getElementById("modal-main-img");
  mainImg.src = cat.image;
  document.getElementById("modal-name").innerText = cat.name;
  document.getElementById("modal-desc").innerText = cat.fullDesc;

  const tagEl = document.getElementById("modal-tag");
  tagEl.innerText = cat.statusText;
  if (cat.status === "adoptable")
    tagEl.style.backgroundColor = "var(--success-color)";
  else if (cat.status === "resident")
    tagEl.style.backgroundColor = "var(--accent-color)";
  else tagEl.style.backgroundColor = "var(--muted-color)";

  const galleryGrid = document.getElementById("modal-gallery");
  galleryGrid.innerHTML = "";

  cat.moreImages.forEach((imgUrl) => {
    const thumb = document.createElement("img");
    thumb.src = imgUrl;
    thumb.className = "gallery-thumb";
    thumb.onclick = function () {
      mainImg.src = imgUrl;
      document
        .querySelectorAll(".gallery-thumb")
        .forEach((t) => t.classList.remove("active"));
      thumb.classList.add("active");
    };
    galleryGrid.appendChild(thumb);
  });

  if (galleryGrid.firstChild) galleryGrid.firstChild.classList.add("active");

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

// --- NEW MENU MODAL LOGIC ---
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
  e.preventDefault(); // Stop anchor jump
  openMenuModal();
});

menuOverlay.addEventListener("click", (e) => {
  if (e.target === menuOverlay) {
    closeMenuModal();
  }
});

renderCards("all");
