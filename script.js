/* === Firebase Configuration & Initialization === */
// **สำคัญ:** แทนที่ค่าเหล่านี้ด้วยข้อมูลจริงจาก Firebase Console ของคุณ
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(); // สำหรับ Cloud Firestore

/* ===== ข้อมูลพื้นฐาน ===== */
const defaultItems = [
  "เทคโนโลยีหุ่นยนต์และเอไอ",
  "เทคโนโลยีกีฬาและสันทนาการ",
  "การจัดการวิศวกรรม",
  "สาขาวิชาดิจิทัลอาร์ต",
  "สาขาวิชาวิทยาการคำนวณ",
  "สาขาวิชาเทคโนโลยีถ่ายภาพและสื่อสร้างสรรค์",
  "การตลาดดิจิทัล",
  "วิศวกรรมข้อมูล"
];

const COLORS = [
  "#fde68a", "#a7f3d0", "#bfdbfe", "#f9a8d4",
  "#c3dafe", "#fdba74", "#fecaca", "#e9d5ff",
  "#fcd34d", "#bbf7d0"
];

let items = [];
const list = document.getElementById("sortable-list");

/* ===== โหลด & แสดงรายการ ===== */
function loadItems() {
  const saved = JSON.parse(localStorage.getItem("survey-items") || "null");
  items = saved && saved.length ? saved : defaultItems.slice();
}

function saveItemsStorage() {
  localStorage.setItem("survey-items", JSON.stringify(items));
}

function renderList() {
  list.innerHTML = "";
  items.forEach((txt, idx) => {
    const li = document.createElement("li");
    li.textContent = txt;
    li.dataset.id = idx;
    li.style.setProperty('--color', COLORS[idx % COLORS.length]);
    li.setAttribute('draggable', 'true');
    list.appendChild(li);
  });
  addDragAndDropListeners();
}

// โค้ดส่วน Drag & Drop (เหมือนเดิม)
let draggingItem = null;
function addDragAndDropListeners() {
  const listItems = list.querySelectorAll("li");
  listItems.forEach(item => {
    item.addEventListener("dragstart", () => {
      draggingItem = item;
      setTimeout(() => item.classList.add("dragging"), 0);
    });

    item.addEventListener("dragend", () => {
      draggingItem.classList.remove("dragging");
      draggingItem = null;
      updateItemsArray(); // อัปเดต items array หลังจากจัดลำดับเสร็จ
      saveItemsStorage(); // บันทึกการเปลี่ยนแปลงลง localStorage
    });

    item.addEventListener("dragover", e => {
      e.preventDefault();
      const afterElement = getDragAfterElement(list, e.clientY);
      const currentItem = document.querySelector(".dragging");
      if (afterElement == null) {
        list.appendChild(currentItem);
      } else {
        list.insertBefore(currentItem, afterElement);
      }
    });
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll("li:not(.dragging)")];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function updateItemsArray() {
  const updatedItems = [];
  list.querySelectorAll("li").forEach(li => {
    updatedItems.push(li.textContent);
  });
  items = updatedItems;
  // console.log("Updated items array:", items); // สำหรับ debug
}

/* ===== ส่งคำตอบไปยัง Firebase Firestore ===== */
async function submitRanking() {
  updateItemsArray();
  const ranking = items; // items คือ array ของลำดับที่จัดไว้

  try {
    // เพิ่มข้อมูลลงใน Collection ชื่อ 'rankings'
    await db.collection("rankings").add({
      timestamp: firebase.firestore.FieldValue.serverTimestamp(), // เวลาจากเซิร์ฟเวอร์จาก Firestore
      ranking: ranking
    });

    alert("ส่งคำตอบเรียบร้อย\nขอบคุณที่ร่วมทำแบบสำรวจ!");
    // อาจจะต้องการรีเซ็ตฟอร์มหรือแสดงผลลัพธ์
    // loadItems(); // โหลดรายการเริ่มต้นกลับมา
    // renderList(); // แสดงรายการเริ่มต้น
  } catch (error) {
    console.error("Error writing document to Firestore: ", error);
    alert("เกิดข้อผิดพลาดในการส่งคำตอบ: " + error.message + "\nโปรดตรวจสอบคอนโซล (F12) สำหรับรายละเอียดเพิ่มเติม");
  }
}

/* ===== Admin Login Functions (เหมือนเดิม) ===== */
const ADMIN_USER = "admin";
const ADMIN_PASS = "admin123"; // **คำเตือน: รหัสผ่านนี้ไม่ปลอดภัย ห้ามใช้ในการใช้งานจริง!**

function showLogin() {
  document.getElementById("ranking-view").classList.add("hidden");
  document.getElementById("admin-view").classList.add("hidden");
  document.getElementById("login-view").classList.remove("hidden");
  document.getElementById("login-msg").textContent = "";
  document.getElementById("user").value = "";
  document.getElementById("pass").value = "";
}

function hideLogin() {
  document.getElementById("login-view").classList.add("hidden");
  document.getElementById("ranking-view").classList.remove("hidden");
}

function doLogin() {
  const user = document.getElementById("user").value;
  const pass = document.getElementById("pass").value;
  const msg = document.getElementById("login-msg");

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    msg.textContent = "";
    document.getElementById("login-view").classList.add("hidden");
    document.getElementById("admin-view").classList.remove("hidden");
    loadAdminItems(); // โหลดรายการสำหรับ Admin
    showStats(); // แสดงสถิติเมื่อเข้าสู่ระบบ Admin
  } else {
    msg.textContent = "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง";
  }
}

function logout() {
  document.getElementById("admin-view").classList.add("hidden");
  document.getElementById("ranking-view").classList.remove("hidden");
}

/* ===== Admin Panel Functions (ใช้ localStorage สำหรับจัดการ items, ไม่เกี่ยวกับ Firebase โดยตรง) ===== */
function loadAdminItems() {
  document.getElementById("admin-items").value = items.join("\n");
}

function saveItems() {
  const newItemsText = document.getElementById("admin-items").value;
  const newItemsArray = newItemsText.split("\n").map(item => item.trim()).filter(item => item !== "");
  items = newItemsArray;
  saveItemsStorage();
  renderList();
  document.getElementById("admin-msg").textContent = "บันทึกรายการเรียบร้อย!";
  setTimeout(() => document.getElementById("admin-msg").textContent = "", 3000);
}


/* ===== แสดงสถิติจาก Firebase Firestore ===== */
async function showStats() {
  const statsDiv = document.getElementById("stats");
  statsDiv.innerHTML = "กำลังโหลดสถิติจาก Firebase...";

  try {
    const snapshot = await db.collection("rankings").get(); // ดึงข้อมูลทั้งหมดจาก Collection 'rankings'
    const allRankingsData = [];
    snapshot.forEach(doc => {
      const docData = doc.data();
      if (docData.ranking && Array.isArray(docData.ranking)) {
        allRankingsData.push(docData.ranking); // เก็บเฉพาะ array ของ ranking
      }
    });

    if (allRankingsData.length === 0) {
      statsDiv.innerHTML = "ยังไม่มีข้อมูลตอบแบบสำรวจใน Firebase";
      return;
    }

    // --- เริ่มต้น logic การคำนวณสถิติ (เหมือน Apps Script เดิม) ---
    const summary = {};
    allRankingsData.forEach(rankingArray => {
      rankingArray.forEach((item, index) => {
        if (!item) return; // ข้ามค่าว่าง
        if (!summary[item]) summary[item] = { count: 0, sum: 0, top1: 0 };
        summary[item].count++;
        summary[item].sum += (index + 1); // index + 1 คือลำดับ (1st, 2nd, ฯลฯ)
        if (index === 0) summary[item].top1++; // ถ้าเป็นอันดับ 1
      });
    });

    const result = Object.keys(summary).map(key => ({
      item: key,
      count: summary[key].count,
      avg: summary[key].sum / summary[key].count,
      top1: summary[key].top1
    }));
    // --- สิ้นสุด logic การคำนวณสถิติ ---

    // สร้างตารางแสดงผล
    const table = document.createElement("table");
    table.className = "stats-table"; // ใช้ class เดิมจาก style.css

    const thead = document.createElement("thead");
    thead.innerHTML = "<tr><th>สาขา</th><th>จำนวนนักเรียนเลือกอันดับ 1</th><th>ค่าเฉลี่ยลำดับ (ยิ่งต่ำยิ่งนิยม)</th></tr>";
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    result
      .sort((a, b) => a.avg - b.avg) // เรียงตามค่าเฉลี่ยลำดับ
      .forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${row.item}</td>
          <td>${row.top1}</td>
          <td>${row.avg.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
      });
    table.appendChild(tbody);

    statsDiv.innerHTML = ""; // ล้างข้อความ "กำลังโหลด..."
    statsDiv.appendChild(table); // เพิ่มตาราง

  } catch (error) {
    console.error("Error fetching stats from Firestore: ", error);
    statsDiv.innerHTML = "เกิดข้อผิดพลาดในการโหลดสถิติ: " + error.message + "\nโปรดตรวจสอบคอนโซล (F12) สำหรับรายละเอียดเพิ่มเติม";
  }
}


/* ===== Initialization ===== */
document.addEventListener("DOMContentLoaded", () => {
  loadItems();
  renderList();
});