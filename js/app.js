(() => {
  const ACTION_URL =
    "https://script.google.com/macros/s/AKfycbzX3OQCRcW9iHDAdE91fmCinVegWGgsXg64O9pJQFh1HSZy4ecdHDpQNvUHi4qs5jQ3Hg/exec";

  const MAX = window.MAX_MACHINES || 3;
  const CATALOG = window.MACHINE_CATALOG || [];
  const PARTS = window.BODY_PARTS || [];

  const form = document.getElementById("booking-form");
  const partArea = document.getElementById("part-area");
  const machineGrid = document.getElementById("machine-grid");
  const machineEmpty = document.getElementById("machine-empty");
  const machineCount = document.getElementById("machine-count");
  const menuStrip = document.getElementById("menu-strip");
  const menuList = document.getElementById("menu-list");
  const userRequestFinal = document.getElementById("user_request_final");
  const bookingDate = document.getElementById("booking_date");
  const bookingTime = document.getElementById("booking_time");
  const timeGrid = document.getElementById("time-grid");
  const dateError = document.getElementById("date-error");
  const dateRangeInfo = document.getElementById("date-range-info");
  const bookingPicked = document.getElementById("booking-picked");
  const pickedSummary = document.getElementById("picked-summary");
  const successView = document.getElementById("success-view");
  const completeOverlay = document.getElementById("complete-overlay");
  const submitBtn = document.getElementById("submit-btn");
  const ageInput = document.getElementById("age");
  const hero = document.querySelector(".hero");
  const siteHeader = document.querySelector(".site-header");

  const t = (key, fallback) =>
    window.JoyfitI18n ? JoyfitI18n.t(key, fallback) : fallback;

  const machineName = (machine) =>
    t(`machineNames.${machine.id}`, machine.name);

  form.setAttribute("action", ACTION_URL);
  form.setAttribute("method", "POST");
  form.setAttribute("target", "hidden_iframe");

  let activePart = null;
  const selectedIds = new Set();

  const byId = Object.fromEntries(CATALOG.map((m) => [m.id, m]));

  // --- Body parts ---
  PARTS.forEach((part) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "part-chip";
    btn.dataset.part = part.id;
    btn.innerHTML = `<span data-i18n="${part.i18n}">${part.label}</span>`;
    btn.addEventListener("click", () => {
      activePart = part.id;
      partArea.querySelectorAll(".part-chip").forEach((el) => {
        el.classList.toggle("is-active", el.dataset.part === activePart);
      });
      renderMachines();
    });
    partArea.appendChild(btn);
  });

  const updateCount = () => {
    machineCount.textContent = t("machines.count", "{n} / 3").replace(
      "{n}",
      String(selectedIds.size)
    );
  };

  const updateMenuStrip = () => {
    menuList.innerHTML = "";
    if (selectedIds.size === 0) {
      menuStrip.hidden = true;
      return;
    }
    menuStrip.hidden = false;
    [...selectedIds].forEach((id, index) => {
      const machine = byId[id];
      if (!machine) return;
      const li = document.createElement("li");
      li.innerHTML = `<span class="menu-num">${index + 1}</span><span class="menu-name">${machineName(machine)}</span>`;
      menuList.appendChild(li);
    });
  };

  const renderMachines = () => {
    machineGrid.innerHTML = "";

    if (!activePart) {
      machineEmpty.hidden = false;
      machineGrid.hidden = true;
      updateCount();
      updateMenuStrip();
      return;
    }

    const list = CATALOG.filter((m) => m.parts.includes(activePart));
    machineEmpty.hidden = true;
    machineGrid.hidden = false;

    list.forEach((machine) => {
      const checked = selectedIds.has(machine.id);
      const card = document.createElement("label");
      card.className = `machine-card${checked ? " is-selected" : ""}`;
      card.innerHTML = `
        <input type="checkbox" class="machine-check visually-hidden" value="${machine.id}" ${checked ? "checked" : ""}>
        <span class="machine-check-mark" aria-hidden="true"></span>
        <span class="machine-thumb">
          <img src="${machine.img}" alt="${machineName(machine)}" loading="lazy" width="320" height="240">
        </span>
      `;

      const input = card.querySelector("input");
      input.addEventListener("change", () => {
        if (input.checked) {
          if (selectedIds.size >= MAX) {
            input.checked = false;
            alert(t("machines.maxAlert", "マシンは最大3つまで選べます。"));
            return;
          }
          selectedIds.add(machine.id);
          card.classList.add("is-selected");
        } else {
          selectedIds.delete(machine.id);
          card.classList.remove("is-selected");
        }
        updateCount();
        updateMenuStrip();
      });

      machineGrid.appendChild(card);
    });

    updateCount();
    updateMenuStrip();
  };

  // --- Date range ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = new Date(today);
  maxDate.setMonth(maxDate.getMonth() + 1);
  maxDate.setDate(maxDate.getDate() - 1);

  const toInputDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const formatJa = (d) => `${d.getMonth() + 1}/${d.getDate()}`;

  bookingDate.min = toInputDate(today);
  bookingDate.max = toInputDate(maxDate);

  const updateRangeInfo = () => {
    dateRangeInfo.textContent = t(
      "booking.range",
      "{start} – {end} ／ 月・木は不可"
    )
      .replace("{start}", formatJa(today))
      .replace("{end}", formatJa(maxDate));
  };

  for (let h = 11; h < 20; h++) {
    ["00", "30"].forEach((min) => {
      const time = `${h}:${min}`;
      const id = `time-${h}-${min}`;
      const wrap = document.createElement("div");
      wrap.className = "time-slot";
      wrap.innerHTML = `
        <input type="radio" name="time_choice" id="${id}" value="${time}">
        <label for="${id}">${time}</label>
      `;
      timeGrid.appendChild(wrap);
    });
  }

  const updatePicked = () => {
    if (bookingDate.value && bookingTime.value) {
      const [, m, d] = bookingDate.value.split("-").map(Number);
      pickedSummary.textContent = `${m}/${d}  ${bookingTime.value}`;
      bookingPicked.hidden = false;
    } else {
      bookingPicked.hidden = true;
    }
  };

  const clearTimeSelection = () => {
    bookingTime.value = "";
    timeGrid.querySelectorAll('input[type="radio"]').forEach((r) => {
      r.checked = false;
    });
    updatePicked();
  };

  const setTimeEnabled = (enabled) => {
    timeGrid.dataset.disabled = enabled ? "false" : "true";
    timeGrid.querySelectorAll('input[type="radio"]').forEach((r) => {
      r.disabled = !enabled;
    });
  };

  setTimeEnabled(false);

  timeGrid.addEventListener("change", (e) => {
    if (e.target.matches('input[type="radio"]')) {
      bookingTime.value = e.target.value;
      updatePicked();
    }
  });

  bookingDate.addEventListener("change", () => {
    dateError.hidden = true;
    dateError.textContent = "";

    if (!bookingDate.value) {
      clearTimeSelection();
      setTimeEnabled(false);
      return;
    }

    const [y, m, d] = bookingDate.value.split("-").map(Number);
    const selected = new Date(y, m - 1, d);
    const day = selected.getDay();

    if (day === 1 || day === 4) {
      bookingDate.value = "";
      clearTimeSelection();
      setTimeEnabled(false);
      dateError.textContent = t(
        "booking.monThuError",
        "月曜・木曜は予約できません"
      );
      dateError.hidden = false;
      return;
    }

    setTimeEnabled(true);
    updatePicked();
  });

  ageInput.addEventListener("input", () => {
    ageInput.setCustomValidity("");
  });

  const showCompleteScreen = () => {
    completeOverlay.hidden = false;
    completeOverlay.classList.add("is-visible");
    document.body.classList.add("is-completing");

    window.setTimeout(() => {
      form.hidden = true;
      if (hero) hero.hidden = true;
      if (siteHeader) siteHeader.classList.add("is-compact");
      successView.hidden = false;
      document.body.classList.remove("is-completing");
      document.body.classList.add("is-complete");
      completeOverlay.classList.add("is-leaving");

      window.setTimeout(() => {
        completeOverlay.hidden = true;
        completeOverlay.classList.remove("is-visible", "is-leaving");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 320);
    }, 900);
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    ageInput.setCustomValidity("");
    const age = Number(ageInput.value);
    if (!Number.isFinite(age) || age < 16 || age > 100) {
      ageInput.setCustomValidity(
        t("form.ageInvalid", "正しい年齢を入力してください。")
      );
      ageInput.reportValidity();
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (selectedIds.size === 0) {
      alert(t("machines.needAlert", "マシンを1つ以上選んでください。"));
      return;
    }

    if (!bookingTime.value) {
      alert(t("booking.alertTime", "時間を選んでください。"));
      return;
    }

    const selectedMachines = [...selectedIds].map((id) => byId[id]).filter(Boolean);
    // シートには日本語名で保存
    userRequestFinal.value = selectedMachines.map((m) => m.name).join(", ");

    document.getElementById("confirm-date").textContent = bookingDate.value;
    document.getElementById("confirm-time").textContent = bookingTime.value;
    document.getElementById("confirm-tags").textContent = selectedMachines
      .map((m) => machineName(m))
      .join(" / ");

    submitBtn.textContent = t("form.submitting", "送信中...");
    submitBtn.disabled = true;

    form.submit();
    showCompleteScreen();
  });

  window.addEventListener("joyfit:langchange", () => {
    updateRangeInfo();
    updateCount();
    renderMachines();
    if (!dateError.hidden) {
      dateError.textContent = t(
        "booking.monThuError",
        "月曜・木曜は予約できません"
      );
    }
  });

  updateCount();
  JoyfitI18n.init("lecture").then(updateRangeInfo);
})();
