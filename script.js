// --- 1. KONFIGURASI DATABASE (Local Storage) ---
const POSITIVE_WORDS = [
  "bagus",
  "keren",
  "mudah",
  "jelas",
  "puas",
  "senang",
  "mantap",
  "suka",
  "hebat",
  "cepat",
  "lancar",
];
const NEGATIVE_WORDS = [
  "susah",
  "jelek",
  "buruk",
  "bosen",
  "sulit",
  "lama",
  "ngantuk",
  "ribet",
  "gagal",
  "salah",
  "marah",
  "kecewa",
];
let sentimentChartInstance = null;

// Init DB (Data Awal)
function initDB() {
  // --- TAMBAHKAN BARIS INI UNTUK RESET DATABASE ---
  localStorage.clear();
  // ---------------------------------------------

  if (!localStorage.getItem("users")) {
    const defaultUsers = [
      // ADMIN SESUAI REQUEST: admin / 12345678
      {
        username: "admin",
        password: "12345678",
        role: "admin",
        name: "Administrator",
        class: "-",
      },
    ];
    localStorage.setItem("users", JSON.stringify(defaultUsers));
  }
  if (!localStorage.getItem("feedbacks")) {
    localStorage.setItem("feedbacks", JSON.stringify([]));
  }
}

// --- 2. LOGIC AUTH ---
function switchAuthTab(tab) {
  const loginForm = document.getElementById("form-login");
  const regForm = document.getElementById("form-register");
  const tabLogin = document.getElementById("tab-login");
  const tabReg = document.getElementById("tab-register");

  if (tab === "login") {
    loginForm.classList.remove("hidden-section");
    regForm.classList.add("hidden-section");
    tabLogin.className =
      "flex-1 py-4 text-center font-bold text-blue-600 border-b-2 border-blue-600 transition";
    tabReg.className =
      "flex-1 py-4 text-center font-bold text-gray-500 hover:text-blue-500 transition";
  } else {
    loginForm.classList.add("hidden-section");
    regForm.classList.remove("hidden-section");
    tabReg.className =
      "flex-1 py-4 text-center font-bold text-blue-600 border-b-2 border-blue-600 transition";
    tabLogin.className =
      "flex-1 py-4 text-center font-bold text-gray-500 hover:text-blue-500 transition";
  }
}

function handleLogin() {
  const userIn = document.getElementById("login-username").value;
  const passIn = document.getElementById("login-password").value;
  const users = JSON.parse(localStorage.getItem("users"));
  const userFound = users.find(
    (u) => u.username === userIn && u.password === passIn,
  );

  if (userFound) {
    localStorage.setItem("currentUser", JSON.stringify(userFound));
    renderDashboard();
  } else {
    document.getElementById("login-error").classList.remove("hidden");
  }
}

function handleRegister() {
  const name = document.getElementById("reg-name").value;
  const username = document.getElementById("reg-username").value;
  const password = document.getElementById("reg-password").value;
  const role = document.getElementById("reg-role").value;

  // Kelas diset default '-' karena field tidak ada
  const kelas = "-";

  if (!name || !username || !password) {
    alert("Lengkapi data!");
    return;
  }

  const users = JSON.parse(localStorage.getItem("users"));
  if (users.find((u) => u.username === username)) {
    alert("Username sudah dipakai!");
    return;
  }

  users.push({ username, password, role: role, name, class: kelas });
  localStorage.setItem("users", JSON.stringify(users));

  document.getElementById("reg-success").classList.remove("hidden");
  setTimeout(() => switchAuthTab("login"), 1500);
}

function handleLogout() {
  localStorage.removeItem("currentUser");
  location.reload();
}

// --- 3. LOGIC DASHBOARD ---
function renderDashboard() {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  if (!user) return;

  document.getElementById("auth-screen").classList.add("hidden-section");
  document
    .getElementById("dashboard-screen")
    .classList.remove("hidden-section");

  document.getElementById("user-display-name").innerText = user.name;
  document.getElementById("user-avatar").innerText = user.name.charAt(0);

  // Hide all menus first
  ["admin", "guru", "siswa"].forEach((r) =>
    document.getElementById("menu-" + r).classList.add("hidden"),
  );

  // Show menu based on role
  if (user.role === "admin") {
    document.getElementById("menu-admin").classList.remove("hidden");
    switchPage("admin-home");
    updateChart();
  } else if (user.role === "teacher") {
    document.getElementById("menu-guru").classList.remove("hidden");
    switchPage("guru-home");
    renderFeedbacksForTeacher();
  } else {
    document.getElementById("menu-siswa").classList.remove("hidden");
    switchPage("siswa-home");
  }
}

function switchPage(pageId) {
  document
    .querySelectorAll(".page-content")
    .forEach((el) => el.classList.add("hidden-section"));
  document.getElementById("page-" + pageId).classList.remove("hidden-section");

  const titles = {
    "admin-home": "Dashboard Admin",
    "admin-analysis": "Analisis AI",
    "admin-users": "Data Pengguna",
    "guru-home": "Feedback Masuk",
    "siswa-home": "Beri Feedback",
  };
  document.getElementById("page-title").innerText = titles[pageId];

  if (pageId === "admin-home") updateChart();
  if (pageId === "admin-analysis") renderAdminWordcloud();
  if (pageId === "admin-users") loadUserTable();
}

// --- 4. FITUR AI & FEEDBACK ---
function liveAnalyze() {
  const text = document.getElementById("fb-text").value.toLowerCase();
  const preview = document.getElementById("ai-preview");
  const badge = document.getElementById("ai-badge");

  if (text.length < 3) {
    preview.classList.add("hidden");
    return;
  }

  preview.classList.remove("hidden");
  const score = analyzeSentimentScore(text);

  badge.className =
    "inline-block px-3 py-1 rounded-full text-sm font-bold ml-2 transition-colors duration-300";
  if (score > 0) {
    badge.innerText = "POSITIF";
    badge.classList.add("bg-green-100", "text-green-800");
  } else if (score < 0) {
    badge.innerText = "NEGATIF";
    badge.classList.add("bg-red-100", "text-red-800");
  } else {
    badge.innerText = "NETRAL";
    badge.classList.add("bg-gray-200", "text-gray-600");
  }
}

function analyzeSentimentScore(text) {
  let score = 0;
  POSITIVE_WORDS.forEach((w) => {
    if (text.includes(w)) score++;
  });
  NEGATIVE_WORDS.forEach((w) => {
    if (text.includes(w)) score--;
  });
  return score;
}

function submitFeedback() {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  const text = document.getElementById("fb-text").value;
  const matkul = document.getElementById("fb-matkul").value;

  if (!text) {
    alert("Isi komentar dulu!");
    return;
  }

  const score = analyzeSentimentScore(text);
  let sentiment = "Netral";
  if (score > 0) sentiment = "Positif";
  if (score < 0) sentiment = "Negatif";

  const newFeedback = {
    id: Date.now(),
    student: user.name,
    class: user.class,
    matkul: matkul,
    text: text,
    sentiment: sentiment,
    date: new Date().toLocaleDateString(),
  };

  const feedbacks = JSON.parse(localStorage.getItem("feedbacks"));
  feedbacks.unshift(newFeedback);
  localStorage.setItem("feedbacks", JSON.stringify(feedbacks));

  alert("Feedback Terkirim! AI mengklasifikasikan sebagai: " + sentiment);
  document.getElementById("fb-text").value = "";
  liveAnalyze();
}

// --- 5. RENDERING DATA ---
function renderFeedbacksForTeacher() {
  const feedbacks = JSON.parse(localStorage.getItem("feedbacks"));
  const container = document.getElementById("feedback-list-container");
  container.innerHTML = "";

  if (feedbacks.length === 0) {
    container.innerHTML =
      '<div class="text-center text-gray-500 py-10">Belum ada feedback masuk.</div>';
    return;
  }

  feedbacks.forEach((fb) => {
    let colorClass = "border-yellow-300 bg-yellow-50";
    let label = `<span class="text-yellow-700 font-bold"><i class="fas fa-meh"></i> NETRAL</span>`;

    if (fb.sentiment === "Positif") {
      colorClass = "border-green-300 bg-green-50";
      label = `<span class="text-green-700 font-bold"><i class="fas fa-smile"></i> POSITIF</span>`;
    } else if (fb.sentiment === "Negatif") {
      colorClass = "border-red-300 bg-red-50";
      label = `<span class="text-red-700 font-bold"><i class="fas fa-frown"></i> NEGATIF</span>`;
    }

    const card = `
            <div class="p-5 rounded-lg border-l-4 shadow-sm ${colorClass} fade-in">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <span class="font-bold text-gray-800">${fb.student}</span>
                    </div>
                    <span class="text-xs text-gray-400">${fb.date}</span>
                </div>
                <p class="text-sm font-semibold text-gray-600 mb-1">${fb.matkul}</p>
                <p class="text-gray-700 italic">"${fb.text}"</p>
                <div class="mt-3 text-right">${label}</div>
            </div>
        `;
    container.innerHTML += card;
  });
}

function renderAdminWordcloud() {
  const feedbacks = JSON.parse(localStorage.getItem("feedbacks"));
  const container = document.getElementById("admin-wordcloud");

  if (feedbacks.length === 0) {
    container.innerHTML =
      '<span class="text-gray-400 italic">Belum ada data.</span>';
    return;
  }

  const allText = feedbacks
    .map((f) => f.text)
    .join(" ")
    .toLowerCase();
  const words = allText.split(/\s+/);
  const freq = {};
  words.forEach((w) => {
    if (w.length > 3) freq[w] = (freq[w] || 0) + 1;
  });

  const sorted = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  let html = "";
  sorted.forEach(([word, count]) => {
    const size = Math.max(1, Math.min(4, count)) + "rem";
    const color = [
      "text-red-400",
      "text-blue-400",
      "text-green-400",
      "text-yellow-400",
    ][Math.floor(Math.random() * 4)];
    html += `<span style="font-size:${size}" class="${color} font-bold mx-2 cursor-default" title="${count}x">${word}</span>`;
  });
  container.innerHTML = html;
}

function loadUserTable() {
  const users = JSON.parse(localStorage.getItem("users"));
  const tbody = document.getElementById("user-table-body");
  tbody.innerHTML = "";
  users.forEach((u) => {
    let roleLabel = u.role;
    if (roleLabel === "teacher") roleLabel = "Guru";
    if (roleLabel === "student") roleLabel = "Siswa";

    tbody.innerHTML += `
            <tr class="hover:bg-gray-50">
                <td class="p-4 border-b">
                    <div class="font-bold">${u.name}</div>
                    <div class="text-xs text-gray-500">@${u.username}</div>
                </td>
                <td class="p-4 border-b">${roleLabel}</td>
            </tr>
        `;
  });
}

// --- 6. CHART.JS ---
function updateChart() {
  const feedbacks = JSON.parse(localStorage.getItem("feedbacks"));
  const ctx = document.getElementById("sentimentChart").getContext("2d");

  let pos = 0,
    neg = 0,
    neu = 0;
  feedbacks.forEach((f) => {
    if (f.sentiment === "Positif") pos++;
    else if (f.sentiment === "Negatif") neg++;
    else neu++;
  });

  if (sentimentChartInstance) sentimentChartInstance.destroy();

  sentimentChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Positif", "Negatif", "Netral"],
      datasets: [
        {
          data: [pos, neg, neu],
          backgroundColor: ["#4ade80", "#f87171", "#fbbf24"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" },
      },
    },
  });
}

// Cek Login Awal
if (localStorage.getItem("currentUser")) renderDashboard();
