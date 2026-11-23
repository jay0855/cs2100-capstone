class Country {
  constructor(rawObj = {}) {
    this.name = rawObj.name?.common || "Unknown Country";
    this.capital =
       Array.isArray(rawObj.capital) && rawObj.capital.length > 0
       ? rawObj.capital[0]
         : "No Capital";
    this.region = rawObj.region || "Unspecified";
    this.population = typeof rawObj.population === "number" ? rawObj.population : 0;
    this.flagAlt = rawObj.flags?.alt || `Flag of ${this.name}`;
  }

  const API_ENDPOINT =
  "https://restcountries.com/v3.1/all?fields=name,capital,region,population,flags";

const state = {
  countries: [],
  quickSearch: "",
  region: "all",
  sortBy: "population-desc",
  formKeyword: "",
  minPopulation: null,
  maxPopulation: null
};

function createStatusCard(message, variant = "placeholder") {
  const card = document.createElement("div");
  card.className = `card ${variant}`;
  card.textContent = message;
  return card;
}

function createCountryCard(country) {
  const article = document.createElement("article");
  article.className = "card";

  if (country.flag) {
    const img = document.createElement("img");
    img.src = country.flag;
    img.alt = country.flagAlt;
    img.className = "flag";
    img.loading = "lazy";
    article.appendChild(img);
  }

  const title = document.createElement("h4");
  title.className = "country-name";
  title.textContent = country.name;

  const regionBadge = document.createElement("p");
  regionBadge.className = "country-region";
  regionBadge.textContent = country.region;

  const capitalLine = document.createElement("p");
  capitalLine.className = "country-stat";
  const capitalLabel = document.createElement("strong");
  capitalLabel.textContent = "Capital: ";
  capitalLine.append(capitalLabel, document.createTextNode(country.capital));

  const popLine = document.createElement("p");
  popLine.className = "country-stat";
  const popLabel = document.createElement("strong");
  popLabel.textContent = "Population: ";
  popLine.append(popLabel, document.createTextNode(country.population.toLocaleString()));

  article.append(title, regionBadge, capitalLine, popLine);
  return article;
}

function renderCountries(countries) {
  const container = document.getElementById("data-container");
  const countEl = document.getElementById("results-count");
  if (!container) return;

  container.replaceChildren();

  if (countEl) {
    countEl.textContent = `Showing ${countries.length} of ${state.countries.length} countries`;
  }

  if (countries.length === 0) {
    container.appendChild(
      createStatusCard("No countries match your current filters. Try adjusting or resetting your criteria.")
    );
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const country of countries) {
    fragment.appendChild(createCountryCard(country));
  }

  container.appendChild(fragment);
}

function getFilteredAndSortedCountries() {
  const quickTerm = state.quickSearch.trim().toLowerCase();
  const formTerm = state.formKeyword.trim().toLowerCase();

  const filtered = state.countries.filter((country) => {
    const matchesQuick = !quickTerm || country.name.toLowerCase().includes(quickTerm);
    const matchesRegion = state.region === "all" || country.region === state.region;
    const matchesFormKeyword = !formTerm || country.name.toLowerCase().includes(formTerm);
    const matchesMin = state.minPopulation === null || country.population >= state.minPopulation;
    const matchesMax = state.maxPopulation === null || country.population <= state.maxPopulation;

    return (
      matchesQuick &&
      matchesRegion &&
      matchesFormKeyword &&
      matchesMin &&
      matchesMax
    );
  });

  filtered.sort((a, b) => {
    switch (state.sortBy) {
      case "population-asc":
        return a.population - b.population;
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "population-desc":
      default:
        return b.population - a.population;
    }
  });

  return filtered;
}

function updateView() {
  renderCountries(getFilteredAndSortedCountries());
}

function setFieldError(inputEl, errorEl, message) {
  if (!inputEl || !errorEl) return;
  errorEl.textContent = message;
  if (message) {
    inputEl.setAttribute("aria-invalid", "true");
    inputEl.setAttribute("aria-describedby", errorEl.id);
  } else {
    inputEl.removeAttribute("aria-invalid");
    inputEl.removeAttribute("aria-describedby");
  }
}

function validateAndApplyForm(event) {
  event.preventDefault();

  const nameInput = document.getElementById("form-country-name");
  const minInput = document.getElementById("form-min-pop");
  const maxInput = document.getElementById("form-max-pop");

  const nameError = document.getElementById("error-country-name");
  const minError = document.getElementById("error-min-pop");
  const maxError = document.getElementById("error-max-pop");

  const rawKeyword = nameInput.value.trim();
  const rawMin = minInput.value.trim();
  const rawMax = maxInput.value.trim();

  let isValid = true;
  let keywordMessage = "";
  let minMessage = "";
  let maxMessage = "";

  // Input 1: Country keyword length & allowed characters
  if (rawKeyword.length > 0) {
    if (rawKeyword.length < 2 || rawKeyword.length > 50) {
      keywordMessage = "Keyword must be between 2 and 50 characters.";
      isValid = false;
    } else if (!/^[a-zA-Z\s'-]+$/.test(rawKeyword)) {
      keywordMessage = "Use letters, spaces, hyphens, or apostrophes only.";
      isValid = false;
    }
  }

  // Input 2: Minimum population (non-negative number if provided)
  let parsedMin = null;
  if (rawMin.length > 0) {
    const numMin = Number(rawMin);
    if (!Number.isFinite(numMin) || numMin < 0) {
      minMessage = "Minimum population must be 0 or greater.";
      isValid = false;
    } else {
      parsedMin = numMin;
    }
  }

  // Input 3: Maximum population (non-negative and greater than or equal to min if both set)
  let parsedMax = null;
  if (rawMax.length > 0) {
    const numMax = Number(rawMax);
    if (!Number.isFinite(numMax) || numMax < 0) {
      maxMessage = "Maximum population must be 0 or greater.";
      isValid = false;
    } else if (parsedMin !== null && numMax < parsedMin) {
      maxMessage = "Maximum population must be greater than or equal to minimum population.";
      isValid = false;
    } else {
      parsedMax = numMax;
    }
  }

  setFieldError(nameInput, nameError, keywordMessage);
  setFieldError(minInput, minError, minMessage);
  setFieldError(maxInput, maxError, maxMessage);

  if (!isValid) {
    const firstInvalid = [nameInput, minInput, maxInput].find(
      (el) => el.getAttribute("aria-invalid") === "true"
    );
    if (firstInvalid) {
      firstInvalid.focus();
    }
    return;
  }

  state.formKeyword = rawKeyword;
  state.minPopulation = parsedMin;
  state.maxPopulation = parsedMax;
  updateView();
}

function resetAllFilters() {
  const quickSearch = document.getElementById("quick-search");
  const regionFilter = document.getElementById("region-filter");
  const sortBy = document.getElementById("sort-by");
  const form = document.getElementById("custom-filter-form");
  const nameInput = document.getElementById("form-country-name");
  const minInput = document.getElementById("form-min-pop");
  const maxInput = document.getElementById("form-max-pop");

  if (quickSearch) quickSearch.value = "";
  if (regionFilter) regionFilter.value = "all";
  if (sortBy) sortBy.value = "population-desc";
  if (form) form.reset();

  setFieldError(nameInput, document.getElementById("error-country-name"), "");
  setFieldError(minInput, document.getElementById("error-min-pop"), "");
  setFieldError(maxInput, document.getElementById("error-max-pop"), "");

  state.quickSearch = "";
  state.region = "all";
  state.sortBy = "population-desc";
  state.formKeyword = "";
  state.minPopulation = null;
  state.maxPopulation = null;

  updateView();
}

function bindEvents() {
  const quickSearch = document.getElementById("quick-search");
  const regionFilter = document.getElementById("region-filter");
  const sortBy = document.getElementById("sort-by");
  const form = document.getElementById("custom-filter-form");
  const resetBtn = document.getElementById("reset-filters-btn");

  if (quickSearch) {
    quickSearch.addEventListener("input", (event) => {
      state.quickSearch = event.target.value;
      updateView();
    });
  }

  if (regionFilter) {
    regionFilter.addEventListener("change", (event) => {
      state.region = event.target.value;
      updateView();
    });
  }

  if (sortBy) {
    sortBy.addEventListener("change", (event) => {
      state.sortBy = event.target.value;
      updateView();
    });
  }

  if (form) {
    form.addEventListener("submit", validateAndApplyForm);
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", resetAllFilters);
  }
}

async function initApp() {
  const container = document.getElementById("data-container");
  bindEvents();

  if (container) {
    container.replaceChildren(createStatusCard("Loading countries from API..."));
  }
  
  try {
    const response = await fetch(API_ENDPOINT);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const rawData = await response.json();
    state.countries = rawData.map((item) => new Country(item));
    updateView();
  } catch (error) {
    console.error("Failed to fetch country data:", error);
    if (container) {
      container.replaceChildren(
        createStatusCard(
          "Unable to load country data right now. Please check your connection and try again.",
          "error"
        )
      );
    }
  }
}

initApp();
