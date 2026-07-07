const daysInput = document.querySelector("#days");
const rateInput = document.querySelector("#rate");
const categoryInput = document.querySelector("#category");
const totalOutput = document.querySelector("#total");
const whatsappLink = document.querySelector("#whatsapp-link");

const formatCurrency = (value) =>
  new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
  }).format(value);

const buildWhatsappMessage = (days, rate, total, category) => {
  const message = [
    "Assalamualaikum, saya ingin bertanya tentang bayaran fidyah.",
    `Kategori: ${category}`,
    `Bilangan hari: ${days}`,
    `Kadar sehari: RM${rate.toFixed(2)}`,
    `Jumlah anggaran: ${formatCurrency(total)}`,
  ].join("\n");

  return `https://wa.me/601113190312?text=${encodeURIComponent(message)}`;
};

const updateTotal = () => {
  const days = Math.max(0, Number.parseInt(daysInput.value || "0", 10));
  const rate = Math.max(0, Number.parseFloat(rateInput.value || "0"));
  const total = days * rate;
  const category = categoryInput.value;

  totalOutput.textContent = formatCurrency(total);
  whatsappLink.href = buildWhatsappMessage(days, rate, total, category);
};

const setupOnpayFrame = () => {
  const frame = document.querySelector("#onpay-order-form-iframe");

  if (!frame || typeof window.iFrameResize !== "function") {
    return false;
  }

  window.iFrameResize(
    {
      checkOrigin: false,
    },
    "#onpay-order-form-iframe",
  );

  return true;
};

[daysInput, rateInput, categoryInput].forEach((input) => {
  input.addEventListener("input", updateTotal);
  input.addEventListener("change", updateTotal);
});

updateTotal();

window.addEventListener("load", () => {
  if (!setupOnpayFrame()) {
    window.setTimeout(setupOnpayFrame, 1500);
  }
});
