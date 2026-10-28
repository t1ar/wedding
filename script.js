// const 
const WEDDING = {
  start: "2027-01-14T15:00:00+07:00",
  end: "2027-01-14T22:00:00+07:00",
  title: "Arron & Abby's Wedding",
  location: "Garden Chapel, Surabaya",
  description: "Ceremony at 3:00 PM, reception from 5:30 PM.",
  rsvpEndpoint: "" // no rsvp lol
};

const $ = (s, r = document) => r.querySelector(s);
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

//hero parrallax
const hero = $(".hero");
requestAnimationFrame(() => document.body.classList.add("is-loaded"));

let ticking = false;
if (!reduceMotion) {
  addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      if (scrollY < innerHeight) hero.style.backgroundPosition = `center calc(50% + ${scrollY * 0.25}px)`;
      ticking = false;
    });
  }, { passive: true });
}
//nav solid thing
const nav = $("#nav");
const onScroll = () => nav.classList.toggle("scrolled", scrollY > 60);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Close the mobile menu after tapping a link
document.querySelectorAll("#menu .nav-link").forEach(l => l.addEventListener("click", () => {
  const c = bootstrap.Collapse.getInstance($("#menu"));
  if (c) c.hide();
}));

//countdown timer
const startMs = new Date(WEDDING.start).getTime();
const cd = { d: $("#cd-d"), h: $("#cd-h"), m: $("#cd-m"), s: $("#cd-s") };
let cdTimer;
function tick() {
  const diff = startMs - Date.now();
  if (diff <= 0) {
    $("#countdown").innerHTML = '<p class="hero-sub m-0">Today’s the day!</p>';
    clearInterval(cdTimer);
    return;
  }
  cd.d.textContent = Math.floor(diff / 864e5);
  cd.h.textContent = Math.floor(diff / 36e5) % 24;
  cd.m.textContent = Math.floor(diff / 6e4) % 60;
  cd.s.textContent = Math.floor(diff / 1e3) % 60;
}
function startCountdown() { tick(); clearInterval(cdTimer); cdTimer = setInterval(tick, 1000); }
document.addEventListener("visibilitychange", () => document.hidden ? clearInterval(cdTimer) : startCountdown());
startCountdown();

/* ---------- 4. Personal greeting: yoursite.com/?guest=Siti%20and%20Budi ---------- */
const guest = (new URLSearchParams(location.search).get("guest") || "").trim().slice(0, 60);
if (guest) {
  $("#greeting").textContent = `Dear ${guest},`;
  $("#greeting").hidden = false;
  $("#name").value = guest;
}

//add calendar
const icsDate = iso => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
$("#add-to-calendar").addEventListener("click", () => {
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Wedding//EN", "BEGIN:VEVENT",
    `UID:${icsDate(WEDDING.start)}@wedding`,
    `DTSTAMP:${icsDate(new Date().toISOString())}`,
    `DTSTART:${icsDate(WEDDING.start)}`,
    `DTEND:${icsDate(WEDDING.end)}`,
    `SUMMARY:${WEDDING.title}`,
    `LOCATION:${WEDDING.location}`,
    `DESCRIPTION:${WEDDING.description}`,
    "END:VEVENT", "END:VCALENDAR"
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: "wedding.ics" });
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
});

//gallery
const thumbs = [...document.querySelectorAll(".gallery-thumb")];
const modalEl = $("#photoModal");
const modal = new bootstrap.Modal(modalEl);
const modalImg = $("#photoModalImg");
const counter = $("#photoCounter");
let current = 0;

function showPhoto(i) {
  current = (i + thumbs.length) % thumbs.length;
  const t = thumbs[current];
  modalImg.src = t.dataset.full;
  modalImg.alt = t.querySelector("img").alt;
  counter.textContent = `${current + 1} / ${thumbs.length}`;
}
thumbs.forEach((t, i) => t.addEventListener("click", e => { e.preventDefault(); showPhoto(i); modal.show(); }));
$("#photoPrev").addEventListener("click", () => showPhoto(current - 1));
$("#photoNext").addEventListener("click", () => showPhoto(current + 1));
modalEl.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") showPhoto(current - 1);
  if (e.key === "ArrowRight") showPhoto(current + 1);
});
modalEl.addEventListener("hidden.bs.modal", () => { modalImg.src = ""; });

//rsvp form
const form = $("#rsvp-form");
const status = $("#rsvp-status");
const attend = $("#attend");
const guestsWrap = $("#guests-wrap");
const guestsInput = $("#guests");

// Hide guest count if the person is declining
attend.addEventListener("change", () => {
  const declining = attend.value === "Regretfully decline";
  guestsWrap.hidden = declining;
  guestsInput.disabled = declining;
});

form.addEventListener("submit", async e => {
  e.preventDefault();
  form.classList.add("was-validated");
  if (!form.checkValidity()) {
    status.className = "mt-3 text-warning";
    status.textContent = "Please fill in the highlighted fields.";
    form.querySelector(":invalid").focus();
    return;
  }
  const btn = form.querySelector("button[type=submit]");
  btn.disabled = true; btn.textContent = "Sending…";
  try {
    if (WEDDING.rsvpEndpoint) {
      const res = await fetch(WEDDING.rsvpEndpoint, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form)
      });
      if (!res.ok) throw new Error("Request failed");
    } else {
      await new Promise(r => setTimeout(r, 600)); // demo mode
    }
    const declined = attend.value === "Regretfully decline";
    form.reset(); form.classList.remove("was-validated"); guestsWrap.hidden = false; guestsInput.disabled = false;
    status.className = "mt-3 text-success";
    status.textContent = declined
      ? "Thank you for letting us know. We’ll miss you."
      : "Thank you! Your RSVP has been sent. We can’t wait to celebrate with you.";
  } catch {
    status.className = "mt-3 text-danger";
    status.textContent = "Your RSVP didn’t send. Check your connection and try again.";
  } finally {
    btn.disabled = false; btn.textContent = "Send RSVP";
  }
});
