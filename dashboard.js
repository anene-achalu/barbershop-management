import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const dailyEntryBtn = document.getElementById("dailyEntryBtn");
const historyBtn = document.getElementById("historyBtn");
const settingsBtn = document.getElementById("settingsBtn");
const logoutBtn = document.getElementById("logoutBtn");
const welcomeMsg = document.getElementById("welcomeMsg");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (!userDoc.exists()) {
    welcomeMsg.textContent = "Welcome!";
  } else {
    const data = userDoc.data();
    welcomeMsg.textContent = `Welcome, ${data.username || "User"}! Your role: ${data.role || "user"}`;
    if (data.role !== "admin") {
      settingsBtn.style.display = "none";
    }
  }
});

dailyEntryBtn.addEventListener("click", () => {
  window.location.href = "daily-entry.html";
});

historyBtn.addEventListener("click", () => {
  window.location.href = "history.html";
});

settingsBtn.addEventListener("click", () => {
  window.location.href = "settings.html";
});

logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
});
