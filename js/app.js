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
  const timeMeta = document.getElementById("time-meta");
  const successView = document.getElementById("success-view");
  const completeOverlay = document.getElementById("complete-overlay");
  const submitBtn = document.getElementById("submit-btn");
  const ageInput = document.getElementById("age");
  const ageError = document.getElementById("age-error");
  const nameInput = document.getElementById("name");
  const hero = document.querySelector(".hero");
  const siteHeader = document.querySelector(".site-header");
  const successWaitLine = document.getElementById("success-wait-line");

  const ageMessage = () =>
    t("form.ageInvalid", "16歳以上の方が対象です");

  const clearAgeError = () => {
    ageInput.setCustomValidity("");
    ageError.hidden = true;
    ageError.textContent = "";
  };

  const showAgeError = () => {
    const msg = ageMessage();
    ageInput.setCustomValidity(msg);
    ageError.textContent = msg;
    ageError.hidden = false;
  };

  const isAgeValid = () => {
    const age = Number(ageInput.value);
    return Number.isFinite(age) && age >= 16 && age <= 100;
  };

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
      const time = `${String(h).padStart(2, "0")}:${min}`;
      const id = `time-${h}-${min}`;
      const wrap = document.createElement("div");
      wrap.className = "time-slot";
      wrap.dataset.time = time;
      wrap.innerHTML = `
        <input type="radio" name="time_choice" id="${id}" value="${time}">
        <label for="${id}">${time}</label>
      `;
      timeGrid.appendChild(wrap);
    });
  }

  let bookedTimes = new Set();
  let slotsRequestId = 0;

  const normalizeTime = (value) => {
    const m = String(value || "")
      .trim()
      .match(/(\d{1,2})[:：](\d{2})/);
    if (!m) return String(value || "").trim();
    return `${String(Number(m[1])).padStart(2, "0")}:${m[2]}`;
  };

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

  const applyTimeAvailability = (enabled) => {
    timeGrid.dataset.disabled = enabled ? "false" : "true";
    timeGrid.classList.remove("is-loading");

    let bookedCount = 0;
    timeGrid.querySelectorAll(".time-slot").forEach((slot) => {
      const input = slot.querySelector('input[type="radio"]');
      const time = normalizeTime(input.value);
      const booked = enabled && bookedTimes.has(time);
      slot.classList.toggle("is-booked", booked);
      input.disabled = !enabled || booked;
      if (booked) {
        bookedCount += 1;
        if (input.checked) {
          input.checked = false;
          bookingTime.value = "";
        }
      }
    });

    if (!enabled) {
      timeMeta.hidden = true;
      timeMeta.textContent = "";
    } else if (bookedCount > 0) {
      timeMeta.hidden = false;
      timeMeta.textContent = t(
        "booking.bookedHint",
        "グレーの時間は既に予約済みのため選べません"
      );
    } else {
      timeMeta.hidden = true;
      timeMeta.textContent = "";
    }
    updatePicked();
  };

  const fetchBookedTimesJsonp = (date, timeoutMs = 3500) =>
    new Promise((resolve, reject) => {
      const cbName = `joyfitSlots_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
      const script = document.createElement("script");
      let settled = false;

      const cleanup = () => {
        window.clearTimeout(timer);
        delete window[cbName];
        if (script.parentNode) script.parentNode.removeChild(script);
      };

      const finish = (fn, value) => {
        if (settled) return;
        settled = true;
        cleanup();
        fn(value);
      };

      const timer = window.setTimeout(() => {
        finish(reject, new Error("slots timeout"));
      }, timeoutMs);

      window[cbName] = (data) => {
        if (!data || data.ok === false) {
          finish(reject, new Error(data?.error || "slots failed"));
          return;
        }
        finish(resolve, (data.booked || []).map(normalizeTime));
      };

      script.onerror = () => finish(reject, new Error("slots script error"));
      script.src = `${ACTION_URL}?action=slots&date=${encodeURIComponent(date)}&callback=${cbName}`;
      document.head.appendChild(script);
    });

  const fetchBookedTimes = (date) => fetchBookedTimesJsonp(date, 3500);

  const refreshBookedSlots = async (date) => {
    const reqId = ++slotsRequestId;
    // 待たせず先に選択可能にする（予約済みは後からグレーアウト）
    bookedTimes = new Set();
    applyTimeAvailability(true);

    try {
      const times = await fetchBookedTimes(date);
      if (reqId !== slotsRequestId) return;
      bookedTimes = new Set(times);
      applyTimeAvailability(true);
    } catch (err) {
      console.warn("[slots]", err);
      if (reqId !== slotsRequestId) return;
      // 取得失敗時も選択は続行（送信時にサーバー側で二重予約を拒否）
      bookedTimes = new Set();
      applyTimeAvailability(true);
    }
  };

  applyTimeAvailability(false);

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
      applyTimeAvailability(false);
      return;
    }

    const [y, m, d] = bookingDate.value.split("-").map(Number);
    const selected = new Date(y, m - 1, d);
    const day = selected.getDay();

    if (day === 1 || day === 4) {
      bookingDate.value = "";
      clearTimeSelection();
      applyTimeAvailability(false);
      dateError.textContent = t(
        "booking.monThuError",
        "月曜・木曜は予約できません"
      );
      dateError.hidden = false;
      return;
    }

    clearTimeSelection();
    refreshBookedSlots(bookingDate.value);
  });

  ageInput.addEventListener("input", () => {
    if (!ageInput.value || isAgeValid()) {
      clearAgeError();
      return;
    }
    showAgeError();
  });

  ageInput.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (!ageInput.value || !isAgeValid()) {
      showAgeError();
      ageInput.reportValidity();
      return;
    }
    clearAgeError();
    document.getElementById("email")?.focus();
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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!ageInput.value || !isAgeValid()) {
      showAgeError();
      ageInput.reportValidity();
      ageInput.focus();
      return;
    }
    clearAgeError();

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

    if (bookedTimes.has(normalizeTime(bookingTime.value))) {
      alert(
        t(
          "booking.slotTaken",
          "選択した時間はすでに予約済みです。別の時間を選んでください。"
        )
      );
      refreshBookedSlots(bookingDate.value);
      return;
    }

    submitBtn.textContent = t("form.submitting", "送信中...");
    submitBtn.disabled = true;

    // 送信直前にもう一度空き確認（同時申込対策）
    try {
      const latest = await fetchBookedTimes(bookingDate.value);
      bookedTimes = new Set(latest);
      applyTimeAvailability(true);
      if (bookedTimes.has(normalizeTime(bookingTime.value))) {
        alert(
          t(
            "booking.slotTaken",
            "選択した時間はすでに予約済みです。別の時間を選んでください。"
          )
        );
        submitBtn.textContent = t("form.submit", "予約する");
        submitBtn.disabled = false;
        return;
      }
    } catch (err) {
      console.warn("[slots recheck]", err);
    }

    const selectedMachines = [...selectedIds].map((id) => byId[id]).filter(Boolean);
    // シートには日本語名で保存
    userRequestFinal.value = selectedMachines.map((m) => m.name).join(", ");

    const guestName = (nameInput.value || "").trim();
    document.getElementById("confirm-date").textContent = bookingDate.value;
    document.getElementById("confirm-time").textContent = bookingTime.value;
    document.getElementById("confirm-tags").textContent = selectedMachines
      .map((m) => machineName(m))
      .join(" / ");
    successWaitLine.textContent = t(
      "success.wait",
      "{name} 様のご来館を心よりお待ちしております。"
    ).replace("{name}", guestName || "お客様");

    form.submit();
    showCompleteScreen();
  });

  window.addEventListener("joyfit:langchange", () => {
    updateRangeInfo();
    updateCount();
    renderMachines();
    if (!ageError.hidden) {
      showAgeError();
    }
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
