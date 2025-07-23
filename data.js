async function fetchCsv(url) {
  const res = await fetch(url);
  const text = await res.text();
  const rows = text.trim().split("\n").map(r=>r.split(","));
  const [header, ...data] = rows;
  return data.map(r=>Object.fromEntries(header.map((h,i)=>[h.trim(), r[i] || ""])));
}

function init({sheetCsv, containerId, filters, searchField, cardFields, extraFields, detailLink}) {
  fetchCsv(sheetCsv).then(all => {
    const container = document.getElementById(containerId);
    const deptSet = new Set(), yearSet = new Set();
    const search = document.getElementById("searchInput");
    const dept = document.getElementById("deptFilter");
    const year = document.getElementById("yearFilter");

    all.forEach(r=>{
      filters.includes("Department") && deptSet.add(r["Department"]);
      filters.includes("Year of Admission") && yearSet.add(r["Year of Admission"]);
    });

    Array.from(deptSet).sort().forEach(d=>{
      dept.innerHTML += `<option value="${d}">${d}</option>`;
    });
    Array.from(yearSet).sort().forEach(y=>{
      year.innerHTML += `<option value="${y}">${y}</option>`;
    });

    function render() {
      let filtered = all.filter(r =>
        (search.value === "" || r[searchField].toLowerCase().includes(search.value.toLowerCase())) &&
        (dept.value === "" || r["Department"] === dept.value) &&
        (year.value === "" || r["Year of Admission"] === year.value)
      );
      container.innerHTML = filtered.map(r=>cardHtml(r)).join("");
      container.querySelectorAll(".toggle-btn").forEach(btn=>{
        btn.onclick = () => {
          const extra = btn.previousElementSibling;
          extra.style.display = extra.style.display === "none" ? "block" : "none";
          btn.textContent = extra.style.display === "block" ? "Show Less" : "Show More";
        }
      });
    }

    search.oninput = dept.onchange = year.onchange = render;
    render();

    function cardHtml(r) {
      const cfields = cardFields.map(f=>`<p><strong>${f}:</strong> ${r[f]}</p>`).join("");
      const xfields = extraFields.map(f=>`<p><strong>${f}:</strong> ${r[f]}</p>`).join("");

      return `
        <div class="card" onclick="location='${detailLink + encodeURIComponent(r['Roll No'])}'">
          <h3>${r["Student Name"]}</h3>
          ${cfields}
          <div class="extra" style="display:none">${xfields}</div>
          <button class="toggle-btn">Show More</button>
        </div>`;
    }
  });
}

async function loadProfile(sheetCsv, keyField, keyValue, containerId) {
  const all = await fetchCsv(sheetCsv);
  const rec = all.find(r=>r[keyField] === keyValue);
  const div = document.getElementById(containerId);
  if (!rec) return div.innerHTML = "<p>Profile not found.</p>";

  div.innerHTML = Object.entries(rec).map(([k,v]) => `<p><strong>${k}:</strong> ${v}</p>`).join("");
}
