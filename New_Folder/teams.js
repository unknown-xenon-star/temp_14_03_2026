"use strict";

const teamDirectoryRoot = document.getElementById("team-directory-root");

const renderSocialLinks = (socials = {}) => {
  const links = [
    { label: "Instagram", href: socials.instagram },
    { label: "LinkedIn", href: socials.linkedin },
    { label: "GitHub", href: socials.github }
  ].filter((item) => item.href);

  return links.map((item) => (
    `<a href="${item.href}" target="_blank" rel="noopener noreferrer">${item.label}</a>`
  )).join("");
};

const renderMember = (member) => `
  <article class="team-card reveal">
    <div class="team-card__media">
      <span class="team-card__fallback">${member.fallback || "TM"}</span>
      <img src="${member.image}" alt="${member.name}" onerror="this.style.display='none'; this.parentElement.classList.add('team-card__media--fallback');">
      <div class="team-card__socials">
        ${renderSocialLinks(member.socials)}
      </div>
    </div>
    <div class="team-card__body">
      <span class="team-card__role">${member.role}</span>
      <h3>${member.name}</h3>
    </div>
  </article>
`;

const renderTeamCluster = (team) => `
  <div class="team-cluster" id="${team.id}">
    <div class="team-cluster__head">
      <div>
        <p class="section__kicker">${team.kicker}</p>
        <h2 class="section__title">${team.title}</h2>
      </div>
      <p>${team.description}</p>
    </div>
    <div class="team-grid">
      ${team.members.map(renderMember).join("")}
    </div>
  </div>
`;

const initTeamPage = async () => {
  if (!teamDirectoryRoot) return;

  try {
    const response = await fetch("./teams-data.json");
    if (!response.ok) throw new Error(`Failed to load team data: ${response.status}`);

    const data = await response.json();
    const teams = Array.isArray(data.teams) ? data.teams : [];

    teamDirectoryRoot.innerHTML = teams.map(renderTeamCluster).join("");

    if (typeof revealObs !== "undefined") {
      document.querySelectorAll(".team-card.reveal").forEach((el) => revealObs.observe(el));
    }
  } catch (error) {
    teamDirectoryRoot.innerHTML = `
      <article class="events-loading events-loading--error">
        <span class="pill pill--purple">Error</span>
        <h3>Could not load team data.</h3>
        <p>${error.message}</p>
      </article>
    `;
  }
};

initTeamPage();
