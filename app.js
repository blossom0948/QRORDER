const money = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
});

const categories = {
  all: "전체",
  main: "메인",
  side: "사이드",
  drink: "음료",
};

const menu = [
  {
    id: "pork-set",
    category: "main",
    name: "숙성 삼겹살 한판",
    price: 17000,
    desc: "초벌 숙성 삼겹살, 쌈 채소, 기본 찬 구성",
    optionLabel: "고기 굽기 요청",
    options: ["기본", "바싹", "덜 익힘"],
    soldOut: false,
    imagePos: "58% 48%",
  },
  {
    id: "stew",
    category: "side",
    name: "차돌 된장찌개",
    price: 8000,
    desc: "테이블 추가 주문이 잦은 국물 사이드",
    optionLabel: "맵기",
    options: ["보통", "얼큰", "순한맛"],
    soldOut: false,
    imagePos: "80% 72%",
  },
  {
    id: "egg",
    category: "side",
    name: "치즈 계란찜",
    price: 6500,
    desc: "아이 동반 테이블에서 많이 찾는 부드러운 사이드",
    optionLabel: "치즈",
    options: ["기본", "치즈 추가 +1,000원"],
    soldOut: true,
    imagePos: "70% 58%",
  },
  {
    id: "soju",
    category: "drink",
    name: "소주",
    price: 5000,
    desc: "직원 호출 없이 바로 추가 주문",
    optionLabel: "종류",
    options: ["참이슬", "처음처럼", "진로"],
    soldOut: false,
    imagePos: "86% 28%",
  },
  {
    id: "cola",
    category: "drink",
    name: "콜라",
    price: 2500,
    desc: "음료 추가 주문을 빠르게 접수",
    optionLabel: "얼음",
    options: ["얼음 있음", "얼음 없음"],
    soldOut: false,
    imagePos: "88% 42%",
  },
];

const state = {
  activeCategory: "all",
  cart: [],
  orders: [],
  selectedItemId: null,
  selectedQty: 1,
  selectedOption: "",
  soundEnabled: false,
};

const els = {
  tableLabel: document.querySelector("#tableLabel"),
  menuList: document.querySelector("#menuList"),
  cartItems: document.querySelector("#cartItems"),
  cartTotal: document.querySelector("#cartTotal"),
  clearCart: document.querySelector("#clearCart"),
  placeOrder: document.querySelector("#placeOrder"),
  orderFeedback: document.querySelector("#orderFeedback"),
  itemDialog: document.querySelector("#itemDialog"),
  dialogTitle: document.querySelector("#dialogTitle"),
  dialogDesc: document.querySelector("#dialogDesc"),
  qtyValue: document.querySelector("#qtyValue"),
  minusQty: document.querySelector("#minusQty"),
  plusQty: document.querySelector("#plusQty"),
  optionChoices: document.querySelector("#optionChoices"),
  confirmAdd: document.querySelector("#confirmAdd"),
  orderBoard: document.querySelector("#orderBoard"),
  pendingCount: document.querySelector("#pendingCount"),
  cookingCount: document.querySelector("#cookingCount"),
  servedCount: document.querySelector("#servedCount"),
  todaySales: document.querySelector("#todaySales"),
  seedOrder: document.querySelector("#seedOrder"),
  toggleSound: document.querySelector("#toggleSound"),
  cmsList: document.querySelector("#cmsList"),
  qrForm: document.querySelector("#qrForm"),
  storeInput: document.querySelector("#storeInput"),
  tableInput: document.querySelector("#tableInput"),
  domainInput: document.querySelector("#domainInput"),
  qrCanvas: document.querySelector("#qrCanvas"),
  qrUrl: document.querySelector("#qrUrl"),
  copyUrl: document.querySelector("#copyUrl"),
  downloadQr: document.querySelector("#downloadQr"),
};

function formatMoney(value) {
  return money.format(value);
}

function getTableInfo() {
  const params = new URLSearchParams(window.location.search);
  return {
    store: params.get("store") || "고깃집 온기",
    table: params.get("table") || "05",
  };
}

function initTableLabel() {
  const { store, table } = getTableInfo();
  els.tableLabel.textContent = `${store} · ${Number(table) || table}번 테이블`;
  els.storeInput.value = paramsSafeStore(store);
  els.tableInput.value = String(table).padStart(2, "0");
}

function paramsSafeStore(store) {
  return store
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w가-힣-]/g, "")
    .toLowerCase();
}

function renderMenu() {
  const filtered = menu.filter((item) => state.activeCategory === "all" || item.category === state.activeCategory);

  els.menuList.innerHTML = filtered
    .map(
      (item) => `
        <article class="menu-card ${item.soldOut ? "sold-out" : ""}">
          <div class="menu-image" style="background-position:${item.imagePos}" aria-hidden="true"></div>
          <div class="menu-info">
            <h3>${item.name}${item.soldOut ? '<span class="sold-badge">품절</span>' : ""}</h3>
            <p>${item.desc}</p>
            <span class="price">${formatMoney(item.price)}</span>
          </div>
          <button class="add-button" type="button" data-add="${item.id}" ${item.soldOut ? "disabled" : ""} aria-label="${item.name} 담기">+</button>
        </article>
      `,
    )
    .join("");
}

function renderCart() {
  const total = state.cart.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  els.cartTotal.textContent = formatMoney(total);
  els.placeOrder.disabled = state.cart.length === 0;

  if (state.cart.length === 0) {
    els.cartItems.className = "cart-items empty";
    els.cartItems.textContent = "담긴 메뉴가 없습니다.";
    return;
  }

  els.cartItems.className = "cart-items";
  els.cartItems.innerHTML = state.cart
    .map(
      (item, index) => `
        <div class="cart-item">
          <strong><span>${item.name}</span><span>${formatMoney(item.unitPrice * item.qty)}</span></strong>
          <small>${item.option} · ${item.qty}개</small>
          <div class="cart-line-actions">
            <span>${formatMoney(item.unitPrice)} / 개</span>
            <button type="button" data-remove="${index}" aria-label="${item.name} 삭제">×</button>
          </div>
        </div>
      `,
    )
    .join("");
}

function openItemDialog(itemId) {
  const item = menu.find((entry) => entry.id === itemId);
  if (!item || item.soldOut) return;

  state.selectedItemId = item.id;
  state.selectedQty = 1;
  state.selectedOption = item.options[0];

  els.dialogTitle.textContent = item.name;
  els.dialogDesc.textContent = `${item.desc} · ${item.optionLabel} 선택`;
  els.qtyValue.textContent = state.selectedQty;
  renderOptions(item);
  els.itemDialog.showModal();
}

function renderOptions(item) {
  els.optionChoices.innerHTML = item.options
    .map(
      (option) => `
        <button type="button" class="${option === state.selectedOption ? "active" : ""}" data-option="${option}">
          ${option}
        </button>
      `,
    )
    .join("");
}

function addSelectedItem() {
  const item = menu.find((entry) => entry.id === state.selectedItemId);
  if (!item) return;

  const optionPrice = state.selectedOption.includes("+1,000") ? 1000 : 0;
  state.cart.push({
    id: item.id,
    name: item.name,
    option: state.selectedOption,
    qty: state.selectedQty,
    unitPrice: item.price + optionPrice,
  });

  els.orderFeedback.textContent = "";
  renderCart();
}

function placeOrder(source = "customer") {
  if (state.cart.length === 0) return;

  const { table } = getTableInfo();
  const order = {
    id: crypto.randomUUID(),
    table,
    source,
    items: state.cart.map((item) => ({ ...item })),
    total: state.cart.reduce((sum, item) => sum + item.unitPrice * item.qty, 0),
    status: "pending",
    createdAt: new Date(),
  };

  state.orders.unshift(order);
  state.cart = [];
  els.orderFeedback.textContent = `${Number(table) || table}번 테이블 주문이 사장님 보드로 전송되었습니다.`;
  renderCart();
  renderBoard();
  playAlert();
}

function seedTestOrder() {
  const samples = [
    { id: "pork-set", qty: 2, option: "바싹" },
    { id: "soju", qty: 1, option: "참이슬" },
    { id: "stew", qty: 1, option: "얼큰" },
  ];

  state.cart = samples.map((sample) => {
    const item = menu.find((entry) => entry.id === sample.id);
    return {
      id: item.id,
      name: item.name,
      option: sample.option,
      qty: sample.qty,
      unitPrice: item.price,
    };
  });
  placeOrder("admin-test");
}

function renderBoard() {
  const columns = [
    { id: "pending", title: "대기", action: "조리 시작" },
    { id: "cooking", title: "조리중", action: "완료 처리" },
    { id: "served", title: "완료", action: "보드에서 정리" },
  ];

  els.orderBoard.innerHTML = columns
    .map((column) => {
      const orders = state.orders.filter((order) => order.status === column.id);
      return `
        <section class="kanban-column" aria-label="${column.title} 주문">
          <h3>${column.title}<span>${orders.length}</span></h3>
          ${
            orders.length
              ? orders.map((order) => renderOrderCard(order, column)).join("")
              : '<div class="empty-column">주문 없음</div>'
          }
        </section>
      `;
    })
    .join("");

  els.pendingCount.textContent = String(state.orders.filter((order) => order.status === "pending").length);
  els.cookingCount.textContent = String(state.orders.filter((order) => order.status === "cooking").length);
  els.servedCount.textContent = String(state.orders.filter((order) => order.status === "served").length);
  els.todaySales.textContent = formatMoney(state.orders.reduce((sum, order) => sum + order.total, 0));
}

function renderOrderCard(order, column) {
  const itemLines = order.items.map((item) => `<li>${item.name} ${item.qty}개 · ${item.option}</li>`).join("");
  const minutes = Math.max(0, Math.round((Date.now() - order.createdAt.getTime()) / 60000));

  return `
    <article class="order-card ${order.status}">
      <strong>
        <span>${Number(order.table) || order.table}번 테이블</span>
        <span>${formatMoney(order.total)}</span>
      </strong>
      <ul>${itemLines}</ul>
      <small>${minutes === 0 ? "방금 접수" : `${minutes}분 전 접수`}</small>
      <button type="button" data-next-status="${order.id}">${column.action}</button>
    </article>
  `;
}

function nextOrderStatus(orderId) {
  const order = state.orders.find((entry) => entry.id === orderId);
  if (!order) return;

  if (order.status === "pending") order.status = "cooking";
  else if (order.status === "cooking") order.status = "served";
  else state.orders = state.orders.filter((entry) => entry.id !== orderId);

  renderBoard();
}

function renderCms() {
  els.cmsList.innerHTML = menu
    .map(
      (item) => `
        <div class="cms-row">
          <div>
            <strong>${item.name}</strong>
            <small>${categories[item.category]}</small>
          </div>
          <input type="number" min="0" step="500" value="${item.price}" data-price="${item.id}" aria-label="${item.name} 가격" />
          <button class="toggle ${item.soldOut ? "is-off" : ""}" type="button" data-sold="${item.id}">
            ${item.soldOut ? "품절" : "판매중"}
          </button>
        </div>
      `,
    )
    .join("");
}

async function generateQr() {
  const store = els.storeInput.value.trim() || "store_onki_01";
  const table = els.tableInput.value.trim() || "05";
  const domain = els.domainInput.value.trim() || "https://tablelink.example/menu";
  const url = `${domain}?store=${encodeURIComponent(store)}&table=${encodeURIComponent(table)}`;
  els.qrUrl.textContent = url;

  if (!window.QRCode) {
    els.qrUrl.textContent = `${url} · QR 라이브러리를 불러오지 못했습니다.`;
    return;
  }

  await QRCode.toCanvas(els.qrCanvas, url, {
    width: 256,
    margin: 2,
    errorCorrectionLevel: "M",
    color: {
      dark: "#1b2522",
      light: "#ffffff",
    },
  });
}

async function copyQrUrl() {
  const text = els.qrUrl.textContent;
  if (!text) return;
  await navigator.clipboard.writeText(text);
  els.copyUrl.textContent = "복사됨";
  window.setTimeout(() => {
    els.copyUrl.textContent = "URL 복사";
  }, 1200);
}

function downloadQr() {
  const link = document.createElement("a");
  const table = els.tableInput.value.trim() || "05";
  link.download = `table-${table}-qr.png`;
  link.href = els.qrCanvas.toDataURL("image/png");
  link.click();
}

function playAlert() {
  if (!state.soundEnabled) return;
  const audio = new AudioContext();
  const now = audio.currentTime;

  [0, 0.18, 0.36].forEach((offset) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.18, now + offset + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.12);
    osc.connect(gain).connect(audio.destination);
    osc.start(now + offset);
    osc.stop(now + offset + 0.14);
  });
}

function bindEvents() {
  document.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeCategory = button.dataset.category;
      document.querySelectorAll("[data-category]").forEach((tab) => tab.classList.toggle("active", tab === button));
      renderMenu();
    });
  });

  els.menuList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-add]");
    if (button) openItemDialog(button.dataset.add);
  });

  els.optionChoices.addEventListener("click", (event) => {
    const button = event.target.closest("[data-option]");
    if (!button) return;
    const item = menu.find((entry) => entry.id === state.selectedItemId);
    state.selectedOption = button.dataset.option;
    renderOptions(item);
  });

  els.minusQty.addEventListener("click", () => {
    state.selectedQty = Math.max(1, state.selectedQty - 1);
    els.qtyValue.textContent = state.selectedQty;
  });

  els.plusQty.addEventListener("click", () => {
    state.selectedQty += 1;
    els.qtyValue.textContent = state.selectedQty;
  });

  els.confirmAdd.addEventListener("click", (event) => {
    event.preventDefault();
    addSelectedItem();
    els.itemDialog.close();
  });

  els.cartItems.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove]");
    if (!button) return;
    state.cart.splice(Number(button.dataset.remove), 1);
    renderCart();
  });

  els.clearCart.addEventListener("click", () => {
    state.cart = [];
    els.orderFeedback.textContent = "";
    renderCart();
  });

  els.placeOrder.addEventListener("click", () => placeOrder("customer"));
  els.seedOrder.addEventListener("click", seedTestOrder);

  els.toggleSound.addEventListener("click", () => {
    state.soundEnabled = !state.soundEnabled;
    els.toggleSound.textContent = state.soundEnabled ? "알림 끄기" : "알림 켜기";
    els.toggleSound.setAttribute("aria-pressed", String(state.soundEnabled));
    if (state.soundEnabled) playAlert();
  });

  els.orderBoard.addEventListener("click", (event) => {
    const button = event.target.closest("[data-next-status]");
    if (button) nextOrderStatus(button.dataset.nextStatus);
  });

  els.cmsList.addEventListener("input", (event) => {
    const input = event.target.closest("[data-price]");
    if (!input) return;
    const item = menu.find((entry) => entry.id === input.dataset.price);
    item.price = Number(input.value) || 0;
    renderMenu();
    renderCart();
  });

  els.cmsList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-sold]");
    if (!button) return;
    const item = menu.find((entry) => entry.id === button.dataset.sold);
    item.soldOut = !item.soldOut;
    renderMenu();
    renderCms();
  });

  els.qrForm.addEventListener("submit", (event) => {
    event.preventDefault();
    generateQr();
  });

  els.copyUrl.addEventListener("click", copyQrUrl);
  els.downloadQr.addEventListener("click", downloadQr);
}

function init() {
  initTableLabel();
  bindEvents();
  renderMenu();
  renderCart();
  renderBoard();
  renderCms();
  generateQr();
}

init();
