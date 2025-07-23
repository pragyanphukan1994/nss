// Parse CSV to JSON
function parseCSV(csv) {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
    return headers.reduce((obj, header, i) => {
      obj[header] = values[i] ? values[i].replace(/^"|"$/g, '') : '';
      return obj;
    }, {});
  });
}

// Convert Google Drive links to direct image URLs
function getPhotoUrl(rawUrl) {
  if (!rawUrl) return 'https://via.placeholder.com/100';
  const match = rawUrl.match(/[-\w]{25,}/); // extract file ID
  return match ? `https://drive.google.com/uc?export=view&id=${match[0]}` : rawUrl;
}

// Render each card in the list view
function cardHtml(r, cardFields, extraFields, detailLink) {
  const photo = getPhotoUrl(r["Passport Photo"]);
  const name = r["Student Name"];
  const roll = r["Roll No"];
  const link = detailLink + encodeURIComponent(roll);

  let details = cardFields.map(f => `<div><strong>${f}:</strong> ${r[f]}</div>`).join('');
  let extra = extraFields.map(f => `<div><strong>${f}:</strong> ${r[f]}</div>`).join('');

  return `
    <div class="card" onclick="location.href='${link}'">
      <img src="${photo}" alt="Photo of ${name}" />
      <h3>${name}</h3>
      ${details}
      <div class="more" style="display:none;">${extra}</div>
      <button onclick="event.stopPropagation(); toggleDetails(this)">Show More</button>
    </div>`;
}

// Toggle show/hide for extra details
function toggleDetails(btn) {
  const more = btn.parentElement.querySelector('.more');
  const visible = more.style.display === 'block';
  more.style.display = visible ? 'none' : 'block';
  btn.textContent = visible ? 'Show More' : 'Show Less';
}

// Main initializer for list page
function init(config) {
  fetch(config.sheetCsv)
    .then(res => res.text())
    .then(csv => {
      const data = parseCSV(csv);
      const container = document.getElementById(config.containerId);

      // Populate filters
      config.filters.forEach(filter => {
        const select = document.getElementById(filter === "Department" ? "deptFilter" : "yearFilter");
        const options = Array.from(new Set(data.map(r => r[filter]))).sort();
        options.forEach(val => {
          const opt = document.createElement("option");
          opt.value = val;
          opt.textContent = val;
          select.appendChild(opt);
        });
      });

      // Render filtered cards
      function render() {
        const search = document.getElementById("searchInput").value.toLowerCase();
        const dept = document.getElementById("deptFilter").value;
        const year = document.getElementById("yearFilter").value;

        const filtered = data.filter(r =>
          (!search || r[config.searchField]?.toLowerCase().includes(search)) &&
          (!dept || r["Department"] === dept) &&
          (!year || r["Year of Admission"] === year)
        );

        container.innerHTML = filtered.map(r =>
          cardHtml(r, config.cardFields, config.extraFields, config.detailLink)
        ).join('');
      }

      // Event listeners
      document.getElementById("searchInput").addEventListener("input", render);
      document.getElementById("deptFilter").addEventListener("change", render);
      document.getElementById("yearFilter").addEventListener("change", render);

      render();
    });
}

// Detail page loader
function loadProfile(sheetCsv, idField, idValue, containerId) {
  fetch(sheetCsv)
    .then(res => res.text())
    .then(csv => {
      const data = parseCSV(csv);
      const record = data.find(r => r[idField] === idValue);
      const container = document.getElementById(containerId);

      if (!record) {
        container.innerHTML = "<p>Profile not found.</p>";
        return;
      }

      const photo = getPhotoUrl(record["Passport Photo"]);
      let html = `<img src="${photo}" alt="Photo of ${record["Student Name"]}" class="large-pic" />`;

      for (const key in record) {
        if (record[key]) {
          html += `<div><strong>${key}:</strong> ${record[key]}</div>`;
        }
      }

      container.innerHTML = html;
    });
}
