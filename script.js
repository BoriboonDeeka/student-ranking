/* === ปรับ URL แอปส์สคริปต์ของคุณ === */
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzYaoX0t-9baYx9q3lqaDUFqg1dLhmAubKcUKsYr1E_34sUJK7sTX2dZRB7FMdhtFgo/exec"; // <-- เปลี่ยนตรงนี้ให้เป็น URL web app ของคุณ

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
    li.setAttribute("draggable", "true");
    li.textContent = txt;
    li.style.setProperty("--color", COLORS[idx % COLORS.length]);
    list.appendChild(li);
  });
  attachDragHandlers();
  setUniformWidth();
}

function setUniformWidth() {
  let maxWidth = 0;
  list.childNodes.forEach(li => {
    maxWidth = Math.max(maxWidth, li.scrollWidth);
  });
  list.style.width = (maxWidth + 40) + "px"; // add padding
}

/* ===== Drag & Drop ===== */
function attachDragHandlers() {
  let draggingEle = null;
  list.querySelectorAll("li").forEach(li => {
    li.addEventListener("dragstart", e => {
      draggingEle = e.target;
      e.target.classList.add("dragging");
    });
    li.addEventListener("dragend", e => {
      e.target.classList.remove("dragging");
      draggingEle = null;
    });
    li.addEventListener("dragover", e => {
      e.preventDefault();
      const draggingOver = e.target;
      if (draggingEle === draggingOver) return;
      const rect = draggingOver.getBoundingClientRect();
      const offset = e.clientY - rect.top;
      const half = rect.height / 2;
      if (offset < half) {
        list.insertBefore(draggingEle, draggingOver);
      } else {
        list.insertBefore(draggingEle, draggingOver.nextSibling);
      }
      updateItemsArray();
    });
  });
}

function updateItemsArray() {
  items = Array.from(list.querySelectorAll("li")).map(li => li.textContent);
}

/* ===== ส่งคำตอบ ===== */
function submitRanking() {
  updateItemsArray();
  const ranking = items;  // array
  document.getElementById("output").textContent =
    ranking.map((it,i)=>`${i+1}. ${it}`).join("\n");

  // ส่งไป Google Apps Script
  fetch(SCRIPT_URL, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ ranking })
  })
  .then(r => r.text())
  .then(res => {
    alert("ส่งคำตอบเรียบร้อย\nขอบคุณที่ร่วมทำแบบสำรวจ!");
  })
  .catch(err => {
    console.error(err);
    alert("เกิดข้อผิดพลาดในการส่งคำตอบ");
  });
}

/* ===== Login & Admin ===== */
function showLogin() {
  document.getElementById("login-view").classList.remove("hidden");
}
function hideLogin() {
  document.getElementById("login-view").classList.add("hidden");
  document.getElementById("login-msg").textContent = "";
}
function doLogin() {
  const u = document.getElementById("user").value;
  const p = document.getElementById("pass").value;
  if (u === "admin" && p === "1234") {
    localStorage.setItem("adminLogged", "1");
    document.getElementById("login-view").classList.add("hidden");
    showAdminPanel();
  } else {
    document.getElementById("login-msg").textContent = "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง";
  }
}
function showAdminPanel() {
  document.getElementById("ranking-view").classList.add("hidden");
  document.getElementById("admin-view").classList.remove("hidden");
  document.getElementById("admin-items").value = items.join("\n");
  showStats();
}
function saveItems() {
  const lines = document.getElementById("admin-items").value
    .split(/\n+/).map(l=>l.trim()).filter(l=>l);
  if (lines.length === 0) {
    document.getElementById("admin-msg").textContent = "ต้องมีอย่างน้อย 1 รายการ";
    return;
  }
  items = lines;
  saveItemsStorage();
  document.getElementById("admin-msg").textContent = "บันทึกเรียบร้อย ✓";
  renderList();
}
function logout() {
  localStorage.removeItem("adminLogged");
  document.getElementById("admin-view").classList.add("hidden");
  document.getElementById("ranking-view").classList.remove("hidden");
}

/* ===== แสดงสถิติ ===== */
function showStats() {
  const statsDiv = document.getElementById("stats");
  statsDiv.innerHTML = "กำลังโหลด...";
  fetch(SCRIPT_URL+"?stats=1")
    .then(r=>r.json())
    .then(data=>{
      if (!data.rankings || data.rankings.length===0){
        statsDiv.innerHTML = "ยังไม่มีข้อมูลตอบแบบสำรวจ";
        return;
      }
      // สร้างตาราง
      const table = document.createElement("table");
      table.className = "stats-table";
      const thead = document.createElement("thead");
      thead.innerHTML = "<tr><th>สาขา</th><th>จำนวนนักเรียนเลือกอันดับ 1</th><th>ค่าเฉลี่ยลำดับ (ยิ่งต่ำยิ่งนิยม)</th></tr>";
      table.appendChild(thead);
      const tbody = document.createElement("tbody");
      data.rankings
        .sort((a,b)=>a.avg - b.avg)
        .forEach(row=>{
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${row.item}</td>
            <td>${row.top1}</td>
            <td>${row.avg.toFixed(2)}</td>
          `;
          tbody.appendChild(tr);
        });
      table.appendChild(tbody);
      statsDiv.innerHTML = "";
      statsDiv.appendChild(table);
    })
    .catch(err=>{
      console.error(err);
      statsDiv.innerHTML = "เกิดข้อผิดพลาดในการดึงข้อมูล";
    });
}

/* ===== Init ===== */
loadItems();
renderList();
if (localStorage.getItem("adminLogged")==="1"){showAdminPanel();}
