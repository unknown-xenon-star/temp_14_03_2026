"use strict";

const eventsRoot = document.getElementById("events-list");
const INITIAL_GALLERY_LIMIT = 8;

const renderHighlights = (highlights = []) =>
  highlights.map((item) => `<li>${item}</li>`).join("");

const renderGallery = (images = [], title = "") =>
  images.map((src, index) => `
    <figure class="event-gallery__item${index >= INITIAL_GALLERY_LIMIT ? " event-gallery__item--extra" : ""}"${index >= INITIAL_GALLERY_LIMIT ? " hidden" : ""}>
      <img src="${src}" alt="${title} gallery image ${index + 1}" loading="lazy">
    </figure>
  `).join("");

const renderEvent = (event) => {
  const firstImage = event.coverImage || event.images[0] || "";
  const hasHiddenImages = event.images.length > INITIAL_GALLERY_LIMIT;

  return `
    <article class="event-detail reveal" id="${event.id}">
      <div class="event-detail__content">
        <span class="pill">${event.status}</span>
        <h3>${event.name}</h3>
        <p class="event-detail__tagline">${event.tagline}</p>
        <p class="event-detail__summary">${event.summary}</p>
        <p class="event-detail__context">${event.context}</p>
        <div class="event-detail__block">
          <h4>Highlights</h4>
          <ul class="event-detail__highlights">
            ${renderHighlights(event.highlights)}
          </ul>
        </div>
        ${hasHiddenImages ? '<button class="btn btn--ghost event-detail__expand" type="button" aria-expanded="false">Show all images</button>' : ""}
      </div>

      <div class="event-detail__media">
        <div class="event-slideshow">
          <img class="event-slideshow__active" src="${firstImage}" alt="${event.name} featured image">
          <div class="event-slideshow__dots" aria-hidden="true">
            ${event.images.map((_, index) => `<span class="${index === 0 ? "is-active" : ""}"></span>`).join("")}
          </div>
        </div>

        <div class="event-gallery">
          ${renderGallery(event.images, event.name)}
        </div>
      </div>
    </article>
  `;
};

const initSlideshows = () => {
  document.querySelectorAll(".event-detail").forEach((eventCard) => {
    const images = Array.from(eventCard.querySelectorAll(".event-gallery img")).map((img) => img.src);
    const activeImage = eventCard.querySelector(".event-slideshow__active");
    const dots = Array.from(eventCard.querySelectorAll(".event-slideshow__dots span"));
    const expandButton = eventCard.querySelector(".event-detail__expand");
    const extraGalleryItems = Array.from(eventCard.querySelectorAll(".event-gallery__item--extra"));

    let currentIndex = 0;

    const updateSlide = (nextIndex) => {
      currentIndex = nextIndex;
      activeImage.src = images[currentIndex];
      activeImage.alt = `${eventCard.querySelector("h3")?.textContent || "Event"} image ${currentIndex + 1}`;
      dots.forEach((dot, index) => dot.classList.toggle("is-active", index === currentIndex));
    };

    if (images.length > 1) {
      window.setInterval(() => {
        updateSlide((currentIndex + 1) % images.length);
      }, 2800);
    }

    if (expandButton && extraGalleryItems.length) {
      expandButton.addEventListener("click", () => {
        const isExpanded = expandButton.getAttribute("aria-expanded") === "true";
        expandButton.setAttribute("aria-expanded", String(!isExpanded));
        expandButton.textContent = isExpanded ? "Show all images" : "Hide extra images";
        extraGalleryItems.forEach((item) => {
          item.hidden = isExpanded;
        });
      });
    }
  });
};

const scrollToHashTarget = () => {
  const hash = window.location.hash;
  if (!hash) return;

  const target = document.querySelector(hash);
  if (target) {
    window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
};

const initEventPage = async () => {
  if (!eventsRoot) return;

  try {
    const response = await fetch("./events-data.json");
    if (!response.ok) throw new Error(`Failed to load event data: ${response.status}`);

    const data = await response.json();
    const events = Array.isArray(data.events) ? data.events : [];
    eventsRoot.innerHTML = events.map(renderEvent).join("");

    if (typeof revealObs !== "undefined") {
      document.querySelectorAll(".event-detail").forEach((el) => revealObs.observe(el));
    }

    initSlideshows();
    scrollToHashTarget();
  } catch (error) {
    eventsRoot.innerHTML = `
      <article class="events-loading events-loading--error">
        <span class="pill pill--purple">Error</span>
        <h3>Could not load events data.</h3>
        <p>${error.message}</p>
      </article>
    `;
  }
};

initEventPage();
