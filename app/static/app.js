const form = document.getElementById("receipt-form");
const formMessage = document.getElementById("form-message");
const list = document.getElementById("receipts-list");
const searchInput = document.getElementById("search-input");
const categoryInput = document.getElementById("category-input");
const refreshBtn = document.getElementById("refresh-btn");

async function fetchReceipts() {
  const params = new URLSearchParams();
  const q = searchInput.value.trim();
  const category = categoryInput.value.trim();

  if (q) params.set("q", q);
  if (category) params.set("category", category);

  const response = await fetch(`/api/receipts?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to load receipts");
  }

  return response.json();
}

function formatAmount(amount, currency) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: (currency || "USD").toUpperCase(),
    }).format(amount);
  } catch {
    return `${amount} ${currency || "USD"}`;
  }
}

function renderReceipts(receipts) {
  list.innerHTML = "";

  if (!receipts.length) {
    list.innerHTML = "<p class='meta'>No receipts found.</p>";
    return;
  }

  for (const receipt of receipts) {
    const item = document.createElement("article");
    item.className = "item";

    const category = receipt.category ? ` • ${receipt.category}` : "";
    const purchaseDate = receipt.purchase_date || "No date";
    const notes = receipt.notes || "No notes";

    item.innerHTML = `
      <div class="item-top">
        <strong>${receipt.vendor}</strong>
        <div class="actions">
          ${
            receipt.file_path
              ? `<button type="button" data-download="${receipt.id}">Download</button>`
              : ""
          }
          <button type="button" class="delete" data-delete="${receipt.id}">Delete</button>
        </div>
      </div>
      <div>${formatAmount(receipt.amount, receipt.currency)} • ${purchaseDate}${category}</div>
      <div class="meta">${notes}</div>
    `;

    list.appendChild(item);
  }
}

async function refresh() {
  try {
    const receipts = await fetchReceipts();
    renderReceipts(receipts);
  } catch (error) {
    list.innerHTML = `<p class='meta'>${error.message}</p>`;
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formMessage.textContent = "Saving...";

  const body = new FormData(form);
  const response = await fetch("/api/receipts", {
    method: "POST",
    body,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "Failed to save" }));
    formMessage.textContent = payload.error || "Failed to save";
    return;
  }

  form.reset();
  formMessage.textContent = "Saved";
  refresh();
});

list.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;

  const deleteId = target.getAttribute("data-delete");
  if (deleteId) {
    const response = await fetch(`/api/receipts/${deleteId}`, { method: "DELETE" });
    if (response.ok) refresh();
    return;
  }

  const downloadId = target.getAttribute("data-download");
  if (downloadId) {
    window.location.href = `/api/receipts/${downloadId}/file`;
  }
});

searchInput.addEventListener("input", refresh);
categoryInput.addEventListener("input", refresh);
refreshBtn.addEventListener("click", refresh);

refresh();
