document.addEventListener("DOMContentLoaded", () => {
    const paymentForm = document.getElementById("paymentForm");
    const productSelect = document.getElementById("productSelect");
    const quantityInput = document.getElementById("quantity");
    const promoCodeInput = document.getElementById("promoCode");
    const applyPromoBtn = document.getElementById("applyPromoBtn");
    const promoMessage = document.getElementById("promoMessage");
    const subtotalDisplay = document.getElementById("subtotal");
    const discountDisplay = document.getElementById("discount");
    const discountRow = document.getElementById("discountRow");
    const totalAmountDisplay = document.getElementById("totalAmount");
    const transactionList = document.getElementById("transactionList");
    const emptyState = document.getElementById("emptyState");
    const clearHistoryBtn = document.getElementById("clearHistoryBtn");
    const paymentModal = document.getElementById("paymentModal");
    const paymentDetails = document.getElementById("paymentDetails");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const toggleDarkMode = document.getElementById("toggleDarkMode");
  
    let transactions = [];
    let currentDiscount = 0;
    let appliedPromoCode = '';
  
    const promoCodes = {
      HEMAT10: { type: "percentage", discount: 10, description: "Diskon 10%" },
      SUPERHEMAT: { type: "percentage", discount: 20, description: "Diskon 20%" },
      POTONGAN30: { type: "fixed", discount: 30000, description: "Potongan Rp 30.000" },
      NEWUSER: { type: "percentage", discount: 15, description: "Diskon pengguna baru 15%" }
    };
  
    const paymentMethodNames = {
      transfer: "Transfer Bank",
      ewallet: "E-Wallet",
      credit: "Kartu Kredit",
      cash: "Tunai"
    };
  
    function formatCurrency(amount) {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0
      }).format(amount);
    }
  
    function getCurrentTime() {
      const now = new Date();
      return now.toLocaleString("id-ID", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
  
    function calculateSubtotal() {
      const option = productSelect.selectedOptions[0];
      const price = parseInt(option?.dataset.price || 0);
      const qty = parseInt(quantityInput.value || 1);
      return price * qty;
    }
  
    function calculateDiscount(subtotal) {
      const promo = promoCodes[appliedPromoCode];
      if (!promo) return 0;
      return promo.type === "percentage"
        ? Math.round(subtotal * promo.discount / 100)
        : Math.min(promo.discount, subtotal);
    }
  
    function updateTotal() {
      const subtotal = calculateSubtotal();
      const discount = calculateDiscount(subtotal);
      const total = subtotal - discount;
  
      subtotalDisplay.textContent = formatCurrency(subtotal);
      totalAmountDisplay.textContent = formatCurrency(total);
      currentDiscount = discount;
  
      if (discount > 0) {
        discountDisplay.textContent = "-" + formatCurrency(discount);
        discountRow.classList.remove("hidden");
      } else {
        discountRow.classList.add("hidden");
      }
    }
  
    function applyPromoCode() {
      const code = promoCodeInput.value.trim().toUpperCase();
      if (!code) return showPromoMessage("Masukkan kode promo.", "error");
      if (!promoCodes[code]) return showPromoMessage("Kode promo tidak valid.", "error");
  
      appliedPromoCode = code;
      updateTotal();
      showPromoMessage(`Promo "${code}" berhasil: ${promoCodes[code].description}`, "success");
      promoCodeInput.disabled = true;
      applyPromoBtn.disabled = true;
      applyPromoBtn.textContent = "Diterapkan";
      applyPromoBtn.classList.add("bg-gray-400");
      applyPromoBtn.classList.remove("bg-teal-600", "hover:bg-teal-700");
    }
  
    function showPromoMessage(message, type) {
      promoMessage.textContent = message;
      promoMessage.classList.remove("hidden", "text-red-500", "text-green-500");
      promoMessage.classList.add(type === "error" ? "text-red-500" : "text-green-500");
    }
  
    function resetPromo() {
      appliedPromoCode = '';
      currentDiscount = 0;
      promoCodeInput.value = '';
      promoCodeInput.disabled = false;
      applyPromoBtn.disabled = false;
      applyPromoBtn.textContent = "Terapkan";
      applyPromoBtn.classList.remove("bg-gray-400");
      applyPromoBtn.classList.add("bg-teal-600", "hover:bg-teal-700");
      promoMessage.classList.add("hidden");
      updateTotal();
    }
  
    function processPayment(formData) {
      const selectedProduct = productSelect.selectedOptions[0];
      const subtotal = calculateSubtotal();
      const total = subtotal - currentDiscount;
  
      const transaction = {
        id: "TRX-" + Date.now(),
        name: formData.get("customerName"),
        email: formData.get("customerEmail"),
        product: selectedProduct.textContent,
        quantity: formData.get("quantity"),
        method: formData.get("paymentMethod"),
        promo: appliedPromoCode,
        subtotal,
        discount: currentDiscount,
        total,
        time: getCurrentTime()
      };
  
      transactions.push(transaction);
      renderTransaction(transaction);
      showModal(transaction);
      resetForm();
    }
  
    function renderTransaction(transaction) {
      const item = document.createElement("div");
      item.className = "p-4 border border-gray-300 rounded-lg";
  
      item.innerHTML = `
        <div class="flex justify-between mb-2">
          <div>
            <div class="font-medium">${transaction.name}</div>
            <div class="text-sm text-gray-600">${transaction.product} (${transaction.quantity}x)</div>
          </div>
          <div class="text-right">
            <div class="text-lime-700 font-bold">${formatCurrency(transaction.total)}</div>
            <div class="text-xs text-gray-400">${transaction.time}</div>
          </div>
        </div>
        <div class="flex justify-between items-center text-sm">
          <span class="px-2 py-1 rounded-full bg-lime-100 text-lime-800 text-xs">${paymentMethodNames[transaction.method]}</span>
          <span class="px-2 py-1 rounded-full text-xs bg-lime-100 text-lime-800">Berhasil</span>
        </div>
      `;
  
      transactionList.prepend(item);
      emptyState.classList.add("hidden");
      clearHistoryBtn.classList.remove("hidden");
      updateStatistics();
    }
  
    function updateStatistics() {
      const total = transactions.length;
      const revenue = transactions.reduce((sum, t) => sum + t.total, 0);
      const avg = total ? revenue / total : 0;
  
      document.getElementById("totalTransactions").textContent = total;
      document.getElementById("totalRevenue").textContent = formatCurrency(revenue);
      document.getElementById("avgTransaction").textContent = formatCurrency(avg);
    }
  
    function resetForm() {
      paymentForm.reset();
      resetPromo();
      updateTotal();
    }
  
    function showModal(transaction) {
      paymentDetails.innerHTML = `
        <div class="space-y-2">
          <div class="flex justify-between"><span>Nama:</span><span>${transaction.name}</span></div>
          <div class="flex justify-between"><span>Email:</span><span>${transaction.email}</span></div>
          <div class="flex justify-between"><span>Produk:</span><span>${transaction.product}</span></div>
          <div class="flex justify-between"><span>Jumlah:</span><span>${transaction.quantity}</span></div>
          <div class="flex justify-between"><span>Metode:</span><span>${paymentMethodNames[transaction.method]}</span></div>
          ${transaction.discount > 0 ? `<div class="flex justify-between text-green-600"><span>Diskon:</span><span>-${formatCurrency(transaction.discount)}</span></div>` : ""}
          <hr />
          <div class="flex justify-between font-bold"><span>Total:</span><span>${formatCurrency(transaction.total)}</span></div>
        </div>
      `;
      paymentModal.classList.remove("hidden");
      paymentModal.classList.add("flex");
    }
  
    function closeModal() {
      paymentModal.classList.add("hidden");
      paymentModal.classList.remove("flex");
    }
  
    function clearAllTransactions() {
      if (confirm("Hapus semua riwayat transaksi?")) {
        transactions = [];
        transactionList.innerHTML = '';
        emptyState.classList.remove("hidden");
        clearHistoryBtn.classList.add("hidden");
        updateStatistics();
      }
    }
  
    function toggleTheme() {
      const html = document.documentElement;
      html.classList.toggle("dark");
      localStorage.setItem("theme", html.classList.contains("dark") ? "dark" : "light");
    }
  
    // Event bindings
    productSelect.addEventListener("change", updateTotal);
    quantityInput.addEventListener("input", updateTotal);
    applyPromoBtn.addEventListener("click", applyPromoCode);
    promoCodeInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        applyPromoCode();
      }
    });
    paymentForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const formData = new FormData(paymentForm);
      if (!formData.get("paymentMethod")) return alert("Pilih metode pembayaran!");
      processPayment(formData);
    });
    closeModalBtn.addEventListener("click", closeModal);
    paymentModal.addEventListener("click", (e) => {
      if (e.target === paymentModal) closeModal();
    });
    clearHistoryBtn.addEventListener("click", clearAllTransactions);
    toggleDarkMode?.addEventListener("click", toggleTheme);
  
    // Init
    updateTotal();
    if (localStorage.getItem("theme") === "dark") {
      document.documentElement.classList.add("dark");
    }
  });
  