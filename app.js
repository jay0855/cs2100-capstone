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

  getSummary() {
    return `${this.name} | Capital: ${this.capital} | Population: ${this.population.toLocaleString()}`;
  }
}

async function fetchAndProcessCountries() {
  const API_ENDPOINT = "https://restcountries.com/v3.1/all?fields=name,capital,region,population,flags";

  try {
    const response = await fetch(API_ENDPOINT);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const rawData = await response.json();
    const modeledCountries = rawData.map(countryData => new Country(countryData));

    console.log(`Successfully modeled ${modeledCountries.length} countries:`, modeledCountries);
    
    modeledCountries.slice(0, 5).forEach(country => {
      console.log(country.getSummary());
    });

    return modeledCountries;
  } catch (error) {
    console.error("Failed to fetch or process country data pipeline:", error);
  }
}

fetchAndProcessCountries();
