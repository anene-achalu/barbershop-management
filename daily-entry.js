import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, doc, getDocs, setDoc, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
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

const dateInput = document.getElementById("dateInput");
const workerListContainer = document.getElementById("workerListContainer");
const saveDailyBtn = document.getElementById("saveDailyBtn");
const statusMsg = document.getElementById("statusMsg");
const backBtn = document.getElementById("backBtn");

let servicePrices = {
  hair: 600,
  beard: 600,
  shampoo: 400,
  color: 1000,
};

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // Load service prices from settings
  const pricesDoc = await getDoc(doc(db, "settings", "servicePrices"));
  if (pricesDoc.exists()) {
    const data = pricesDoc.data();
    servicePrices = {
      hair: data.hair_price || 600,
      beard: data.beard_price || 600,
      shampoo: data.shampoo_price || 400,
      color: data.color_price || 1000,
    };
  }

  loadWorkers();
});

async function loadWorkers() {
  workerListContainer.innerHTML = "<p>Loading workers...</p>";
  const workersRef = collection(db, "workers");
  const q = query(workersRef, where("status", "==", "active"));
  const querySnapshot = await getDocs(q);

  workerListContainer.innerHTML = "";
  querySnapshot.forEach((docSnap) => {
    const worker = docSnap.data();
    const workerDiv = document.createElement("div");
    workerDiv.classList.add("worker-entry");
    workerDiv.innerHTML = `
      <h3>${worker.name}</h3>
      <label>Haircuts: <input type="number" min="0" value="0" class="hairCount" data-worker-id="${docSnap.id}" /></label><br/>
      <label>Beard: <input type="number" min="0" value="0" class="beardCount" data-worker-id="${docSnap.id}" /></label><br/>
      <label>Shampoo: <input type="number" min="0" value="0" class="shampooCount" data-worker-id="${docSnap.id}" /></label><br/>
      <label>Color: <input type="number" min="0" value="0" class="colorCount" data-worker-id="${docSnap.id}" /></label><br/>
    `;
    workerListContainer.appendChild(workerDiv);
  });
}

saveDailyBtn.addEventListener("click", async () => {
  const date = dateInput.value;
  if (!date) {
    statusMsg.textContent = "Please select a date.";
    return;
  }

  // Gather data for each worker
  const workersData = [];

  const hairInputs = document.querySelectorAll(".hairCount");
  hairInputs.forEach((input) => {
    const id = input.dataset.workerId;
    if (!workersData[id]) workersData[id] = { worker_id: id };
    workersData[id].hair = Number(input.value) || 0;
  });

  const beardInputs = document.querySelectorAll(".beardCount");
  beardInputs.forEach((input) => {
    const id = input.dataset.workerId;
    if (!workersData[id]) workersData[id] = { worker_id: id };
    workersData[id].beard = Number(input.value) || 0;
  });

  const shampooInputs = document.querySelectorAll(".shampooCount");
  shampooInputs.forEach((input) => {
    const id = input.dataset.workerId;
    if (!workersData[id]) workersData[id] = { worker_id: id };
    workersData[id].shampoo = Number(input.value) || 0;
  });

  const colorInputs = document.querySelectorAll(".colorCount");
  colorInputs.forEach((input) => {
    const id = input.dataset.workerId;
    if (!workersData[id]) workersData[id] = { worker_id: id };
    workersData[id].color = Number(input.value) || 0;
  });

  // Save each worker's data
  statusMsg.textContent = "Saving...";

  try {
    for (const id in workersData) {
      const data = workersData[id];
      data.date = date;
      data.total_earned =
        (data.hair * servicePrices.hair) +
        (data.beard * servicePrices.beard) +
        (data.shampoo * servicePrices.shampoo) +
        (data.color * servicePrices.color);
      data.paid = false;

      await setDoc(doc(db, "services", `${date}_${data.worker_id}`), data);
    }
    statusMsg.textContent = "Saved successfully!";
  } catch (err) {
    statusMsg.textContent = "Error: " + err.message;
  }
});

backBtn.addEventListener("click", () => {
  window.location.href = "dashboard.html";
});
