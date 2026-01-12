// --- 1. SETUP SUPABASE ---
const SUPABASE_URL = 'https://xjaixlmbqnuzkfywbshi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqYWl4bG1icW51emtmeXdic2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNzUyOTksImV4cCI6MjA4MzY1MTI5OX0.vJC9a_asScFHYEZVw1rm6PtisLMGRMKXt53N-OucPtE';

if (!window.supabase) { alert("Error: Supabase library not loaded. Check your internet connection."); }
const sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let cats = [];

// --- 2. AUTHENTICATION LOGIC ---
window.onload = async function() {
    const { data: { session } } = await sbClient.auth.getSession();
    if (session) { showDashboard(session.user); }
};

// --- ENABLE 'ENTER' KEY FOR LOGIN ---
// This listens for keypresses on the password field
document.getElementById('password-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        handleLogin(); // Triggers the login function
    }
});

// Optional: Add it to the email field too, just in case
document.getElementById('email-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        document.getElementById('password-input').focus(); // Move to password box
    }
});

async function handleLogin() {
    const email = document.getElementById('email-input').value;
    const password = document.getElementById('password-input').value;
    const btn = document.getElementById('login-btn');
    const errorMsg = document.getElementById('login-error');

    // 1. Reset state (hide error, disable button)
    errorMsg.style.display = 'none'; 
    errorMsg.innerText = "";

    btn.innerText = "Checking...";
    btn.disabled = true;

    // 2. Attempt Login
    const { data, error } = await sbClient.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        console.error("Login Error:", error); // Check your browser console (F12) for details
        
        // 3. Show Error Message
        errorMsg.innerText = "Incorrect email or password."; // User-friendly message
        errorMsg.style.display = 'block';
        errorMsg.style.color = '#e63946'; // Force red color
        errorMsg.style.marginTop = '10px';
        
        // Reset button
        btn.innerText = "Login";
        btn.disabled = false;
    } else {
        showDashboard(data.user);
    }
}

async function handleLogout() {
    await sbClient.auth.signOut();
    window.location.reload();
}

function showDashboard(user) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('user-email').innerText = user.email;
    loadCats();
}

// --- 3. MENU UPLOAD LOGIC ---
const menuBtn = document.getElementById('update-menu-btn');
const menuInput = document.getElementById('menu-file-input');

menuBtn.addEventListener('click', () => menuInput.click());

menuInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const originalText = menuBtn.innerText;
    menuBtn.innerText = "Uploading...";
    menuBtn.disabled = true;

    try {
        // A. Upload to 'menu-images' bucket
        // We use 'menu-main' as the name so it always overwrites the previous one (to save space)
        const fileName = `menu-main-${Date.now()}`; // Unique name to force refresh
        
        // Ensure you created a bucket named 'menu-images' in Supabase!
        const { data, error } = await sbClient.storage
            .from('menu-images')
            .upload(fileName, file);

        if (error) throw error;

        // B. Get Public URL
        const { data: urlData } = sbClient.storage
            .from('menu-images')
            .getPublicUrl(fileName);

        // C. Update Database (site_settings table)
        // UPSERT: Updates if exists, Inserts if new
        const { error: dbError } = await sbClient
            .from('site_settings')
            .upsert(
                { setting_name: 'menu_image_url', setting_value: urlData.publicUrl },
                { onConflict: 'setting_name' }
            );

        if (dbError) throw dbError;

        alert("Menu Updated Successfully!");

    } catch (err) {
        console.error('Menu Upload Error:', err);
        alert("Failed to upload menu. Check console.");
    } finally {
        menuBtn.innerText = originalText;
        menuBtn.disabled = false;
        menuInput.value = ''; // Reset input
    }
});

// --- HERO IMAGE UPLOAD LOGIC ---
const heroBtn = document.getElementById('update-hero-btn');
const heroInput = document.getElementById('hero-file-input');

heroBtn.addEventListener('click', () => heroInput.click());

heroInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const originalText = heroBtn.innerText;
    heroBtn.innerText = "Uploading...";
    heroBtn.disabled = true;

    try {
        // 1. Use a unique name so browser doesn't cache old images
        const fileName = `hero-bg-${Date.now()}`; 
        
        // 2. Upload to the existing 'menu-images' bucket (or create a 'site-assets' bucket if you prefer)
        const { data, error } = await sbClient.storage
            .from('menu-images') // Reusing the existing bucket for simplicity
            .upload(fileName, file);

        if (error) throw error;

        // 3. Get public URL
        const { data: urlData } = sbClient.storage
            .from('menu-images')
            .getPublicUrl(fileName);

        // 4. Update database
        const { error: dbError } = await sbClient
            .from('site_settings')
            .update({ setting_value: urlData.publicUrl })
            .eq('setting_name', 'hero_image_url');

        if (dbError) throw dbError;

        alert("Hero Image Updated Successfully! Refresh the main page to see it.");

    } catch (err) {
        console.error('Hero Upload Error:', err);
        alert("Failed to upload hero image. Check console.");
    } finally {
        heroBtn.innerText = originalText;
        heroBtn.disabled = false;
        heroInput.value = ''; // Reset input
    }
});

// --- 4. CAT DATA LOAD ---
async function loadCats() {
    const { data, error } = await sbClient.from('cats').select('*').order('id', { ascending: true });
    if (error) { console.error("Error loading cats:", error); return; }
    if (data.length === 0) { await uploadInitialData(); } 
    else { cats = data; renderList(); }
}

async function uploadInitialData() {
    const initialCats = [{
        name: "Luna", status: "resident",
        image: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        shortDesc: "Found wandering near Webdieh, Luna was shy at first but now rules the roost.",
        fullDesc: "Luna was found wandering near Webdieh...",
        moreImages: [ "https://images.unsplash.com/photo-1573865526739-10659fec78a5?ixlib=rb-4.0.3&w=200" ]
    }];
    const { error } = await sbClient.from('cats').insert(initialCats);
    if (!error) loadCats();
}

function renderList() {
    const list = document.getElementById('admin-cat-list');
    list.innerHTML = '';
    cats.forEach(cat => {
        let badgeClass = "";
        if(cat.status === 'resident') badgeClass = "status-resident";
        else if(cat.status === 'adoptable') badgeClass = "status-adoptable";
        else badgeClass = "status-adopted";

        list.innerHTML += `
            <div class="cat-item">
                <img src="${cat.image}" class="cat-thumb">
                <div class="cat-details">
                    <h3>${cat.name}</h3>
                    <span class="${badgeClass}">${cat.status}</span>
                </div>
                <div class="actions">
                    <button class="btn btn-primary" onclick="openModal(${cat.id})">Edit</button>
                    <button class="btn btn-danger" onclick="deleteCat(${cat.id})">Delete</button>
                </div>
            </div>`;
    });
}

// --- 5. CAT UPLOAD LOGIC ---
async function uploadFileToSupabase(file) {
    const fileName = `${Date.now()}_${file.name.replace(/\s/g, '')}`;
    // NOTE: Using 'images' bucket for cats as per original code
    const { data, error } = await sbClient.storage.from('images').upload(fileName, file);
    if (error) { alert("Upload failed: " + error.message); return null; }
    const { data: publicData } = sbClient.storage.from('images').getPublicUrl(fileName);
    return publicData.publicUrl;
}

async function uploadMainImage(input) {
    const file = input.files[0];
    if (!file) return;
    const status = document.getElementById('main-status');
    status.innerText = "Uploading...";
    status.className = "upload-status status-uploading";
    document.getElementById('btn-save').disabled = true;

    const url = await uploadFileToSupabase(file);
    if (url) {
        document.getElementById('inp-image').value = url;
        document.getElementById('main-preview').src = url;
        document.getElementById('main-preview').classList.add('show');
        status.innerText = "✓ Ready";
        status.className = "upload-status status-done";
        toggleGalleryButton(); 
    }
    document.getElementById('btn-save').disabled = false;
}

async function uploadGalleryImage(input) {
    const file = input.files[0];
    if (!file) return;
    const row = input.parentElement;
    const hiddenInput = row.querySelector('.gallery-url');
    const status = row.querySelector('span');
    status.innerText = "Uploading...";
    status.style.color = "orange";
    document.getElementById('btn-save').disabled = true;

    const url = await uploadFileToSupabase(file);
    if (url) {
        hiddenInput.value = url;
        const img = row.querySelector('img');
        img.src = url;
        img.style.display = "block";
        status.innerText = "✓ Saved";
        status.style.color = "green";
    }
    document.getElementById('btn-save').disabled = false;
}

// --- 6. FORM LOGIC ---
const galleryContainer = document.getElementById('gallery-container');
const btnAddGallery = document.getElementById('btn-add-gallery');
const inpImage = document.getElementById('inp-image');

function toggleGalleryButton() {
    if(inpImage.value.trim() !== "") { btnAddGallery.disabled = false; } 
    else { btnAddGallery.disabled = true; }
}

function addGalleryRow(url = "") {
    const div = document.createElement('div');
    div.className = 'gallery-input-group';
    div.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:0.8rem; font-weight:bold;">${url ? '✓ Saved' : 'Choose File'}</span>
            <button type="button" class="btn-remove" onclick="this.parentElement.parentElement.remove()">Remove</button>
        </div>
        <input type="file" accept="image/*" onchange="uploadGalleryImage(this)">
        <input type="hidden" class="gallery-url" value="${url}">
        <img src="${url}" class="preview-img ${url ? 'show' : ''}" style="height:50px; width:50px; object-fit:cover; margin-top:5px;">
    `;
    galleryContainer.appendChild(div);
}

function openModal(id = null) {
    document.getElementById('modal-overlay').classList.add('open');
    galleryContainer.innerHTML = '';
    
    if (id) {
        const cat = cats.find(c => c.id === id);
        document.getElementById('edit-id').value = cat.id;
        document.getElementById('inp-name').value = cat.name;
        document.getElementById('inp-status').value = cat.status;
        document.getElementById('inp-image').value = cat.image; 
        document.getElementById('inp-short').value = cat.shortDesc;
        document.getElementById('inp-full').value = cat.fullDesc;
        
        const mainPrev = document.getElementById('main-preview');
        mainPrev.src = cat.image;
        mainPrev.classList.add('show');
        document.getElementById('main-status').innerText = "✓ Current Image";

        if(cat.moreImages) { cat.moreImages.forEach(url => addGalleryRow(url)); }
    } else {
        document.getElementById('edit-id').value = "";
        document.getElementById('inp-name').value = "";
        document.getElementById('inp-image').value = "";
        document.getElementById('inp-short').value = "";
        document.getElementById('inp-full').value = "";
        document.getElementById('main-preview').classList.remove('show');
        document.getElementById('main-status').innerText = "";
    }
    toggleGalleryButton();
}

function closeModal() { document.getElementById('modal-overlay').classList.remove('open'); }

async function saveCat() {
    const mainUrl = document.getElementById('inp-image').value;
    if(!mainUrl) { alert("Main Image is required!"); return; }

    const galleryUrls = [];
    document.querySelectorAll('.gallery-url').forEach(input => {
        if(input.value) galleryUrls.push(input.value);
    });

    const catData = {
        name: document.getElementById('inp-name').value,
        status: document.getElementById('inp-status').value,
        image: mainUrl,
        shortDesc: document.getElementById('inp-short').value,
        fullDesc: document.getElementById('inp-full').value,
        moreImages: galleryUrls
    };

    const id = document.getElementById('edit-id').value;
    let error;
    if(id) {
        const { err } = await sbClient.from('cats').update(catData).eq('id', id);
        error = err;
    } else {
        const { err } = await sbClient.from('cats').insert([catData]);
        error = err;
    }

    if(error) alert("Error: " + error.message);
    else { closeModal(); loadCats(); }
}

async function deleteCat(id) {
    if(confirm("Delete this cat?")) {
        await sbClient.from('cats').delete().eq('id', id);
        loadCats();
    }
}