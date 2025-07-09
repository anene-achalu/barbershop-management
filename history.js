import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, query, collection, where, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
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

const historyDateInput = document.getElementById("historyDate");
const loadHistoryBtn = document.getElementById("loadHistoryBtn");
const historyList = document.getElementById("historyList");
const backBtn = document.getElementById("backBtn");
const exportCsvBtn = document.getElementById("exportCsvBtn");

let currentRecords = [];
let currentDate = "";

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  }
});

loadHistoryBtn.addEventListener("click", async () => {
  const selectedDate = historyDateInput.value;
  if (!selectedDate) {
    alert("Please select a date.");
    return;
  }

  currentDate = selectedDate;
  historyList.innerHTML = "Loading...";
  currentRecords = [];

  const q = query(collection(db, "services"), where("date", "==", selectedDate));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    historyList.innerHTML = "<p>No records found for this date.</p>";
    exportCsvBtn.style.display = "none";
    return;
  }

  historyList.innerHTML = "";
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    currentRecords.push(data);

    const item = document.createElement("div");
    item.classList.add("history-item");
    item.innerHTML = `
      <strong>Worker:</strong> ${data.worker_id} <br />
      <strong>Haircuts:</strong> ${data.hair} <br />
      <strong>Beard:</strong> ${data.beard} <br />
      <strong>Shampoo:</strong> ${data.shampoo} <br />
      <strong>Color:</strong> ${data.color} <br />
      <strong>Total Earned:</strong> ${data.total_earned} <br />
      <strong>Paid:</strong> ${data.paid ? "Yes" : "No"} <br />
      <button class="togglePaidBtn" data-id="${docSnap.id}">${data.paid ? "Mark Unpaid" : "Mark Paid"}</button>
      <hr />
    `;
    historyList.appendChild(item);
  });

  exportCsvBtn.style.display = "inline-block";

  document.querySelectorAll(".togglePaidBtn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const docId = e.target.dataset.id;
      const docRef = doc(db, "services", docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const currentPaid = docSnap.data().paid;
        await updateDoc(docRef, { paid: !currentPaid });
        e.target.textContent = currentPaid ? "Mark Paid" : "Mark Unpaid";
        e.target.parentElement.querySelector("strong:nth-child(7)").textContent = `Paid: ${!currentPaid ? "Yes" : "No"}`;
      }
    });
  });
});

exportCsvBtn.addEventListener("click", () => {
  if (!currentRecords.length) {
    alert("No data to export!");
    return;
  }

  const header = ["Worker ID", "Date", "Haircuts", "Beard", "Shampoo", "Color", "Total Earned", "Paid Status"];
  const rows = currentRecords.map(r => [
    r.worker_id,
    r.date,
    r.hair,
    r.beard,
    r.shampoo,
    r.color,
    r.total_earned,
    r.paid ? "Paid" : "Not Paid"
  ]);

  const csvContent = [header, ...rows]
    .map(e => e.join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `barbershop_report_${currentDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

backBtn.addEventListener("click", () => {
  window.location.href = "dashboard.html";
});
