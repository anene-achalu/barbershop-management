import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const hairPriceInput = document.getElementById("hairPrice");
const beardPriceInput = document.getElementById("beardPrice");
const shampooPriceInput = document.getElementById("shampooPrice");
const colorPriceInput = document.getElementById("colorPrice");
const savePricesBtn = document.getElementById("savePricesBtn");
const pricesStatus = document.getElementById("pricesStatus");

const newWorkerNameInput = document.getElementById("newWorkerName");
const addWorkerBtn = document.getElementById("addWorkerBtn");
const workerListDiv = document.getElementById("workerList");

const backBtn = document.getElementById("backBtn");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
  } else {
    // Check if user is admin
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists() || userDoc.data().role !== "admin") {
      alert("Access denied: Admins only");
      window.location.href = "dashboard.html";
      return;
    }

    loadPrices();
    loadWorkers();
  }
});

async function loadPrices() {
  const pricesDoc = await getDoc(doc(db, "settings", "servicePrices"));
  if (pricesDoc.exists()) {
    const data = pricesDoc.data();
    hairPriceInput.value = data.hair_price || 600;
    beardPriceInput.value = data.beard_price || 600;
    shampooPriceInput.value = data.shampoo_price || 400;
    colorPriceInput.value = data.color_price || 1000;
  } else {
    hairPriceInput.value = 600;
    beardPriceInput.value = 600;
    shampooPriceInput.value = 400;
    colorPriceInput.value = 1000;
  }
}

savePricesBtn.addEventListener("click", async () => {
  try {
    await setDoc(doc(db, "settings", "servicePrices"), {
      hair_price: Number(hairPriceInput.value),
      beard_price: Number(beardPriceInput.value),
      shampoo_price: Number(shampooPriceInput.value),
      color_price: Number(colorPriceInput.value),
    });
    pricesStatus.textContent = "✅ Prices saved!";
    pricesStatus.style.color = "green";
  } catch (error) {
    pricesStatus.textContent = "❌ Error saving prices: " + error.message;
    pricesStatus.style.color = "red";
  }
});

async function loadWorkers() {
  workerListDiv.innerHTML = "<p>Loading workers...</p>";
  const workersRef = collection(db, "workers");
  const q = query(workersRef);
  const querySnapshot = await getDocs(q);

  workerListDiv.innerHTML = "";
  querySnapshot.forEach((docSnap) => {
    const worker = docSnap.data();
    const workerDiv = document.createElement("div");
    workerDiv.classList.add("worker-item");
    workerDiv.innerHTML = `
      <span>${worker.name} - ${worker.status}</span>
      <button data-id="${docSnap.id}" class="toggleStatusBtn">
        ${worker.status === "active" ? "Deactivate" : "Reactivate"}
      </button>
    `;
    workerListDiv.appendChild(workerDiv);
  });

  document.querySelectorAll(".toggleStatusBtn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      const docRef = doc(db, "workers", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const currentStatus = docSnap.data().status;
        const newStatus = currentStatus === "active" ? "inactive" : "active";
        await updateDoc(docRef, { status: newStatus });
        loadWorkers();
      }
    });
  });
}

addWorkerBtn.addEventListener("click", async () => {
  const name = newWorkerNameInput.value.trim();
  if (name.length === 0) return;

  const newDocRef = doc(collection(db, "workers"));
  await setDoc(newDocRef, {
    name,
    status: "active",
  });
  newWorkerNameInput.value = "";
  loadWorkers();
});

backBtn.addEventListener("click", () => {
  window.location.href = "dashboard.html";
});
