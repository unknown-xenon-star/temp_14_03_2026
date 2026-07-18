"use strict";

const eventsRoot = document.getElementById("events-list");
const INITIAL_GALLERY_LIMIT = 8;

const renderHighlights = (highlights = []) =>
  highlights.map((item) => `<li>${item}</li>`).join("");

const renderGallery = (images = [], title = "") =>
  images.map((src, index) => `
    <button class="event-gallery__item${index === 0 ? " is-active" : ""}${index >= INITIAL_GALLERY_LIMIT ? " event-gallery__item--extra" : ""}" type="button" data-slide-index="${index}" aria-label="Show ${title} image ${index + 1}"${index >= INITIAL_GALLERY_LIMIT ? " hidden" : ""}>
      <img src="${src}" alt="${title} gallery image ${index + 1}" loading="lazy">
    </button>
  `).join("");

const renderEvent = (event) => {
  const hasImages = event.images && event.images.length > 0;
  const firstImage = event.coverImage || (hasImages ? event.images[0] : "") || "";
  const hasHiddenImages = hasImages && event.images.length > INITIAL_GALLERY_LIMIT;
  const hiddenImageCount = hasImages ? Math.max(event.images.length - INITIAL_GALLERY_LIMIT, 0) : 0;
  const hiddenImageLabel = hiddenImageCount === 1 ? "image" : "images";

  return `
    <article class="event-detail reveal${!hasImages ? " event-detail--no-media" : ""}" id="${event.id}">
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
        ${hasHiddenImages ? `<button class="btn btn--ghost event-detail__expand" type="button" aria-expanded="false" data-hidden-count="${hiddenImageCount}">Show ${hiddenImageCount} more ${hiddenImageLabel}</button>` : ""}
      </div>

      ${hasImages ? `
      <div class="event-detail__media">
        <div class="event-slideshow">
          <img class="event-slideshow__active" src="${firstImage}" alt="${event.name} featured image">
          ${event.images.length > 1 ? `
            <button class="event-slideshow__control event-slideshow__control--prev" type="button" aria-label="Show previous image">Prev</button>
            <button class="event-slideshow__control event-slideshow__control--next" type="button" aria-label="Show next image">Next</button>
          ` : ""}
          <div class="event-slideshow__dots" aria-label="${event.name} slideshow images">
            ${event.images.map((_, index) => `<button class="${index === 0 ? "is-active" : ""}" type="button" data-slide-index="${index}" aria-label="Show image ${index + 1}"></button>`).join("")}
          </div>
        </div>

        <div class="event-gallery">
          ${renderGallery(event.images, event.name)}
        </div>
      </div>
      ` : ""}
    </article>
  `;
};

const initSlideshows = () => {
  document.querySelectorAll(".event-detail").forEach((eventCard) => {
    const images = Array.from(eventCard.querySelectorAll(".event-gallery img")).map((img) => img.src);
    const activeImage = eventCard.querySelector(".event-slideshow__active");
    const dots = Array.from(eventCard.querySelectorAll(".event-slideshow__dots button"));
    const galleryButtons = Array.from(eventCard.querySelectorAll(".event-gallery__item"));
    const prevButton = eventCard.querySelector(".event-slideshow__control--prev");
    const nextButton = eventCard.querySelector(".event-slideshow__control--next");
    const expandButton = eventCard.querySelector(".event-detail__expand");
    const extraGalleryItems = Array.from(eventCard.querySelectorAll(".event-gallery__item--extra"));

    let currentIndex = 0;

    const updateSlide = (nextIndex) => {
      currentIndex = nextIndex;
      activeImage.src = images[currentIndex];
      activeImage.alt = `${eventCard.querySelector("h3")?.textContent || "Event"} image ${currentIndex + 1}`;
      dots.forEach((dot, index) => dot.classList.toggle("is-active", index === currentIndex));
      galleryButtons.forEach((button, index) => button.classList.toggle("is-active", index === currentIndex));
    };

    const showPrevious = () => {
      updateSlide((currentIndex - 1 + images.length) % images.length);
    };

    const showNext = () => {
      updateSlide((currentIndex + 1) % images.length);
    };

    if (images.length > 1) {
      window.setInterval(() => {
        showNext();
      }, 2800);

      prevButton?.addEventListener("click", showPrevious);
      nextButton?.addEventListener("click", showNext);
    }

    dots.forEach((dot) => {
      dot.addEventListener("click", () => updateSlide(Number(dot.dataset.slideIndex || 0)));
    });

    galleryButtons.forEach((button) => {
      button.addEventListener("click", () => updateSlide(Number(button.dataset.slideIndex || 0)));
    });

    if (expandButton && extraGalleryItems.length) {
      expandButton.addEventListener("click", () => {
        const isExpanded = expandButton.getAttribute("aria-expanded") === "true";
        const hiddenCount = Number(expandButton.dataset.hiddenCount || extraGalleryItems.length);
        const hiddenImageLabel = hiddenCount === 1 ? "image" : "images";
        expandButton.setAttribute("aria-expanded", String(!isExpanded));
        expandButton.textContent = isExpanded ? `Show ${hiddenCount} more ${hiddenImageLabel}` : "Hide extra images";
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

    if (typeof window.revealObs !== "undefined") {
      document.querySelectorAll(".event-detail").forEach((el) => window.revealObs.observe(el));
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
