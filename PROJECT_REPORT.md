# COVID-19 Intelligence Dashboard
## Project Documentation Report

**Project Title:** COVID Intelligence — Interactive Global Pandemic Dashboard  
**Technology Stack:** HTML5 · CSS3 · JavaScript (ES2020) · D3.js v7 · TopoJSON  
**Data Source:** Kaggle COVID-19 Dataset (Worldometer)  
**Date:** June 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Data Sources](#2-data-sources)
3. [Data Engineering](#3-data-engineering)
4. [Visualizations](#4-visualizations)
5. [Key Findings & Insights](#5-key-findings--insights)
6. [Technical Architecture](#6-technical-architecture)
7. [Why This Project Matters](#7-why-this-project-matters)

---

## 1. Project Overview

The COVID Intelligence Dashboard is a fully client-side, browser-based analytical tool that transforms raw pandemic CSV data into a suite of eight interactive visualizations. It was built to answer one central question: **What does the global COVID-19 pandemic actually look like in numbers — and what patterns does that data reveal?**

The project started from a repository that relied on the now-deprecated [disease.sh](https://disease.sh) API. All external API dependencies were removed and replaced with curated, locally-served CSV files from the Kaggle COVID-19 dataset. The result is a self-contained, offline-capable dashboard that runs on a simple static file server and loads entirely in the browser.

The dashboard presents data for **208 countries** across **188 days** of the early pandemic (January 22 – July 27, 2020), covering the critical first wave that defined the world's initial response.

---

## 2. Data Sources

### 2.1 Primary Source

**Kaggle — COVID-19 Dataset (Worldometer Compilation)**  
Originally scraped from [worldometers.info/coronavirus](https://www.worldometers.info/coronavirus/), one of the most cited real-time COVID-19 tracking sites during the pandemic. This dataset was widely used by researchers, journalists, and public health agencies.

### 2.2 Files Used

| File | Rows | Purpose |
|---|---|---|
| `worldometer_data.csv` | 208 countries | Country-level snapshot statistics |
| `day_wise.csv` | 188 days | Global daily time series |
| `country_wise_latest.csv` | 188 countries | Weekly change percentage supplement |

#### `worldometer_data.csv` — Country Snapshot
The backbone of the dashboard. Each row is one country with the following fields:

| Column | Description |
|---|---|
| `Country/Region` | Full country name |
| `Continent` | Continental grouping (6 categories) |
| `Population` | Estimated national population |
| `TotalCases` | Cumulative confirmed infections |
| `TotalDeaths` | Cumulative deaths |
| `TotalRecovered` | Cumulative recoveries |
| `ActiveCases` | Currently active infections |
| `Serious,Critical` | Patients in serious/critical condition |
| `Tot Cases/1M pop` | Cases normalized per 1 million people |
| `Deaths/1M pop` | Deaths normalized per 1 million people |
| `TotalTests` | Total diagnostic tests conducted |
| `Tests/1M pop` | Tests normalized per 1 million people |
| `NewCases` | New cases on the snapshot date |
| `NewDeaths` | New deaths on the snapshot date |

#### `day_wise.csv` — Global Time Series
A day-by-day global aggregate enabling the pandemic curve to be plotted over time.

| Column | Description |
|---|---|
| `Date` | Date string (MM/DD/YY) |
| `Confirmed` | Running total confirmed cases |
| `Deaths` | Running total deaths |
| `Recovered` | Running total recoveries |
| `Active` | Active cases that day |
| `New cases` | Daily new confirmed cases |
| `New deaths` | Daily new deaths |
| `New recovered` | Daily new recoveries |

#### `country_wise_latest.csv` — Weekly Momentum
Provides a 1-week change count and percentage per country, used to flag which countries were accelerating or decelerating.

### 2.3 Files Removed

The following files were present but removed as they were either empty, redundant, or excessively large for a browser-based tool:

| File | Size | Reason Removed |
|---|---|---|
| `covid_data.csv` | 0 bytes | Empty file |
| `covid_ts_data.csv` | 0 bytes | Empty file |
| `usa_county_wise.csv` | ~69 MB | US county-level granularity, out of scope for global view |
| `covid_19_clean_complete.csv` | ~3.3 MB | Redundant — covered by the three selected files |
| `full_grouped.csv` | ~1.8 MB | Redundant grouping, same data in a different layout |

---

## 3. Data Engineering

### 3.1 Loading Strategy

All three CSV files are loaded in parallel using D3.js's `d3.csv()` with `Promise.all()`, eliminating sequential loading delays:

```javascript
const [worldometerRaw, dayWiseRaw, countryWiseRaw] = await Promise.all([
    d3.csv('data/worldometer_data.csv'),
    d3.csv('data/day_wise.csv'),
    d3.csv('data/country_wise_latest.csv'),
]);
```

### 3.2 Data Normalization

Raw CSV strings are parsed into typed JavaScript objects. Key transformations include:

- **Numeric coercion** — all case/death/test counts cast from string to integer via `parseInt()`
- **Float coercion** — rates and percentages cast via `parseFloat()`
- **Country code mapping** — country names mapped to ISO 3166-1 alpha-2 codes for choropleth rendering (e.g., `"USA" → "US"`, `"United Kingdom" → "GB"`)
- **Continent join** — week-over-week change data from `country_wise_latest.csv` merged into the primary country records by country name
- **Date parsing** — `day_wise.csv` dates parsed into JavaScript `Date` objects for D3 time scales

### 3.3 Global State Schema

The normalized `globalData` array holds one object per country with the following computed fields:

```
country, country_code, continent, population,
confirmed, deaths, recovered, active, critical,
casesPerMillion, deathsPerMillion,
totalTests, testsPerMillion,
newCases, newDeaths,
weekChange, weekPct
```

The `timeSeriesData` array holds one object per day:

```
date, cases, deaths, recovered, active,
newCases, newDeaths, newRecovered
```

### 3.4 Key Metrics Computed at Runtime

| Metric | Computation |
|---|---|
| **Fatality Rate** | `(deaths / confirmed) × 100` |
| **Recovery Rate** | `(recovered / confirmed) × 100` |
| **Pearson Correlation** (tests vs cases) | Computed analytically across all countries |
| **Average Cases/Million** | Mean across all 208 countries |
| **Total Global Tests** | Sum of `totalTests` across all countries |

---

## 4. Visualizations

### 4.1 Hero Statistics Grid

**Type:** KPI cards  
**Data:** Global aggregate from `worldometer_data.csv`

Displays four top-line global numbers prominently at the top of the page:
- **Total Confirmed Cases:** 19.2 million
- **Total Deaths:** 713,000
- **Recovery Rate:** ~63%
- **Countries Affected:** 208

These numbers are computed live from the loaded CSV, not hardcoded, ensuring they reflect the actual data file.

---

### 4.2 Choropleth World Map

**Type:** Geographic heat map  
**Library:** D3.js + TopoJSON (Natural Earth 110m projection)  
**Data:** `worldometer_data.csv`

A world map where each country is filled with a color encoding the selected metric. The user can switch between:

- Total Confirmed Cases
- Total Deaths
- Active Cases
- Cases Per Million
- Deaths Per Million
- Total Tests
- Tests Per Million

**Color scale:** D3's `interpolateViridis` — perceptually uniform, colorblind-friendly, ranging from purple (low) through teal to yellow (high). The scale dynamically adjusts its domain to the maximum value of whichever metric is selected.

**Interactivity:**
- Mouse hover shows country name, exact value, and additional context (cases/million, fatality rate)
- Scroll-wheel zoom and click-drag pan using D3's `zoom()` behavior
- Smooth transitions between metrics

**What it shows:** Absolute case counts concentrate in large, densely populated countries (USA, Brazil, India). Switching to per-capita metrics reveals a very different picture — smaller European nations like Belgium and Luxembourg top the list, reflecting population density and early outbreak severity.

---

### 4.3 Bar Chart — Top Countries

**Type:** Vertical bar chart  
**Data:** `worldometer_data.csv`, sorted descending by selected metric, sliced to Top N

A ranked comparison of the most-affected countries. The user controls:
- **Metric selector** — any of the 7 available metrics
- **Top N selector** — 10, 15, 20, or 30 countries

Country names are rendered at a −45° angle to prevent overlap. The y-axis label updates dynamically to reflect the active metric. Tooltips show the exact value plus cases/million for context.

**What it shows:** The absolute scale of the USA's outbreak is starkly apparent — its confirmed case count during this period was nearly double that of Brazil (2nd place). However, per-million views reveal that several smaller European nations experienced proportionally far higher burdens.

---

### 4.4 Pie / Donut Chart — Cases by Continent

**Type:** Donut chart with external legend  
**Data:** `worldometer_data.csv`, aggregated by `continent`

Displays the share of global cases attributed to each of the 6 continents. Renders as a donut (with a hollow center) to reduce the visual distortion common in full pie charts.

Each continent slice is:
- Labeled with percentage inside (for large slices)
- Listed in a right-side legend showing name + percentage
- Highlighted on hover

**Distribution (as of July 2020):**
- North America: ~30.9%
- Asia: ~24.5%
- South America: ~24.3%
- Europe: ~18.3%
- Africa: ~1.6%
- Australia/Oceania: ~0.4%

**What it shows:** Despite containing the world's most populous countries, Asia had contained its spread relatively well by mid-2020. The Americas (North + South combined) accounted for over half of all global cases — a reflection of how hard the USA and Brazil were hit during this window.

---

### 4.5 Line Chart — Global Pandemic Timeline

**Type:** Multi-series line chart with dual display modes  
**Data:** `day_wise.csv` (188 daily records)

The only time-series chart in the dashboard. Plots the global pandemic curve from January 22 to July 27, 2020.

**Two display modes (toggle):**

| Mode | Series Shown | Visual Style |
|---|---|---|
| **Cumulative** | Total Cases, Total Deaths, Total Recovered | Smooth exponential curves |
| **Daily New** | New Cases, New Deaths, New Recoveries | Area fill showing wave structure |

**Time range filters:** All · 1 Year · 90 Days · 30 Days — implemented by slicing the `timeSeriesData` array relative to the latest date in the dataset.

**What it shows:**
- **Cumulative mode:** The characteristic exponential growth curve of an uncontrolled pandemic. Cases (blue) surge dramatically from April onward. Recoveries (green) lag behind but begin catching up by June–July.
- **Daily new mode:** Pandemic waves become visible. The April–May peak, a brief plateau, and a resurgence in June–July 2020 are clearly distinguishable — the early signature of what would become the second wave.

---

### 4.6 Bubble Chart — Multivariate Country Analysis

**Type:** Log-scale scatter plot with sized bubbles  
**Data:** `worldometer_data.csv`  
**Axes:** Both on logarithmic scale

The most analytically rich chart in the dashboard. Each bubble represents one country, positioned and sized by three independent variables simultaneously:

| Visual Channel | Variable | Scale |
|---|---|---|
| X position | Cases per Million | Logarithmic |
| Y position | Deaths per Million | Logarithmic |
| Bubble size | Tests per Million | Linear area |
| Bubble color | Continent | Categorical |

Countries with fewer than 5,000 confirmed cases are filtered out to avoid noise from small-sample outliers.

**What it shows:**
- **European countries** cluster at the top-right — high cases/million AND high deaths/million, reflecting early and severe outbreaks in Italy, UK, Belgium, and Spain.
- **Qatar and UAE** appear far right on the X-axis (extremely high cases/million) but low on Y (low deaths/million), suggesting young demographic profiles and strong testing capacity.
- **Large bubbles = high testing.** Countries like the USA and UK show large bubbles, indicating extensive testing infrastructure. Many African and Asian nations have small bubbles — not necessarily fewer cases, but less testing capacity.
- **The log scale is essential** — it prevents the USA and Brazil from dominating the chart and allows smaller countries to be meaningfully compared.

---

### 4.7 Horizontal Bar Chart — Mortality Rate Leaders

**Type:** Horizontal bar chart  
**Data:** `worldometer_data.csv`, sorted by fatality rate (deaths/cases × 100)

Ranks countries by their case fatality rate (CFR) — the percentage of confirmed cases that resulted in death. The gradient coloring (orange → red) encodes the severity of the rate.

**Top findings:**
- France: **15.5%** — highest CFR in the dataset
- United Kingdom: **15.1%**
- Italy: **14.1%**
- Belgium: **13.9%**
- Mexico: **10.9%**

A footer note clarifies the formula: `Fatality Rate = (Deaths / Cases) × 100`

**What it shows:** Western European nations dominate this chart — a consequence of older population demographics, overwhelmed healthcare systems in the early weeks, and (importantly) limited testing capacity that left many mild cases undetected, inflating the apparent death rate. This chart is one of the most counterintuitive in the dashboard: countries that appear well-developed are shown with the highest fatality rates, illustrating that CFR is heavily influenced by testing strategy, not just healthcare quality.

---

### 4.8 Treemap — Hierarchical Impact View

**Type:** D3 treemap (squarified layout)  
**Data:** `worldometer_data.csv`, hierarchically grouped: World → Continent → Country

Visualizes the entire world's caseload as a proportionally-sized nested rectangle layout. Each country's rectangle area is proportional to its total confirmed cases. Rectangles are colored by continent.

**What it shows:**
- The **USA block** (5.0M cases, green) is the single largest rectangle — visually overwhelming relative to most other countries
- **Brazil** (2.9M) and **India** (2.0M) are the next largest
- The **European purple cluster** (Russia, Italy, Spain, UK) highlights how broadly the continent was affected despite smaller populations
- **South Africa** (orange, 538K) stands out as the dominant African nation — context that is easy to miss in other chart types

The treemap excels at showing relative scale across a large number of entities simultaneously. All 208 countries are visible in a single view, something no other chart in the dashboard achieves.

---

### 4.9 Radar Chart — Country Comparison

**Type:** Spider / radar chart  
**Data:** `worldometer_data.csv`

Enables direct multi-dimensional comparison of any two countries across 6 normalized metrics:

1. Cases per Million
2. Deaths per Million
3. Tests per Million
4. Total Cases
5. Total Deaths
6. Fatality Rate (%)

Each metric is normalized to a [0, 1] scale relative to the global maximum, so countries can be meaningfully overlaid regardless of absolute scale differences. The default comparison is **USA vs. India**.

**What it shows:**
- **USA** scores very high on Tests/Million and Total Cases — reflecting both extensive testing and the sheer scale of the outbreak
- **India** has a notably smaller polygon overall at this snapshot in time (July 2020), before its second wave — illustrating how the pandemic's global progression was asynchronous
- The shape of each country's polygon is its pandemic "fingerprint" — a country with high tests but low deaths has a very different profile from one with high deaths but low testing

---

## 5. Key Findings & Insights

### Finding 1: Per-Capita Metrics Tell a Completely Different Story
When switching the choropleth map or bar chart from absolute counts to per-million rates, the ranking of countries changes dramatically. Belgium, Luxembourg, and Qatar emerge as some of the most heavily affected — countries nearly invisible in absolute counts. This demonstrates why normalization is essential for any honest cross-country comparison.

### Finding 2: Europe's High Fatality Rates Were a Testing Artifact
The mortality rate chart shows France, UK, Italy, and Belgium with CFRs above 13%. This is not evidence of worse healthcare — it reflects that in early 2020, testing was highly rationed to severe cases. The "denominator" (total confirmed cases) was artificially low, making the rate appear high. Countries with broader testing programs (like Germany or South Korea) showed much lower CFRs.

### Finding 3: The Americas Drove the First Wave's Second Half
The pie chart shows North and South America together accounting for ~55% of global cases as of July 2020. The line chart confirms this: while early growth was centered in Asia and Europe (Feb–April), the curve steepened again in June–July as the USA, Brazil, and Mexico surged. The pandemic was not a single synchronized global event — it was a rolling series of regional outbreaks.

### Finding 4: Testing Infrastructure Varies by Orders of Magnitude
The bubble chart's bubble sizes span an enormous range. Some nations conducted millions of tests per million population; others barely registered. This matters because confirmed case counts are only as reliable as the testing program behind them — a country with low tests/million almost certainly has a much higher true case burden than its confirmed count suggests.

### Finding 5: India and Brazil's Trajectories Were Just Beginning
The treemap and bar charts show India at 2.0M and Brazil at 2.9M in July 2020. Both countries would go on to experience far more severe outbreaks in 2021. The dashboard captures a moment in time — and that moment shows these countries on steep upward trajectories.

---

## 6. Technical Architecture

### 6.1 Stack

| Layer | Technology |
|---|---|
| Markup | HTML5, semantic elements |
| Styling | CSS3 with custom properties (dark/light theming) |
| Logic | Vanilla JavaScript (ES2020 modules) |
| Visualization | D3.js v7 |
| Geography | TopoJSON Natural Earth 110m |
| Data transport | Static file serving (Python `http.server`) |

### 6.2 File Structure

```
covid-dashboard/
├── index.html               # Application shell, all chart containers
├── css/
│   └── style.css            # Full dark/light theme, all component styles
├── js/
│   ├── app.js               # Data loading, state management, controls
│   └── charts.js            # All 8 D3 rendering functions
└── data/
    ├── worldometer_data.csv  # 208-country snapshot
    ├── day_wise.csv          # 188-day global time series
    └── country_wise_latest.csv  # Weekly change supplement
```

### 6.3 Design Decisions

**No build step.** The entire application runs as plain HTML/CSS/JS files served statically. No webpack, no npm, no transpilation. Any developer can clone the repository and run `python -m http.server` to have a fully functional dashboard.

**CSS custom properties for theming.** All colors are defined as CSS variables (`--text-primary`, `--bg-card`, `--border-color`, etc.). D3 chart code reads these at render time using `getComputedStyle()`, ensuring charts automatically respect the active theme without re-rendering.

**Logarithmic scales where appropriate.** The bubble chart uses log scales on both axes — a deliberate choice to prevent outliers (USA, Brazil) from compressing the rest of the data into an unreadable cluster near zero.

**Responsive SVG sizing.** All charts measure their container's bounding rectangle at render time and size the SVG accordingly, making the dashboard usable across different screen widths.

**Export capability.** A built-in "Export CSV" function serializes the entire normalized dataset — including all computed fields — to a downloadable file for users who want to do further analysis in Excel or other tools.

---

## 7. Why This Project Matters

### 7.1 Data Literacy in a Crisis
The COVID-19 pandemic was one of the most extensively data-reported events in history — and also one of the most widely misunderstood. Numbers like "1 million cases" or "15% death rate" were cited without context, leading to misinformation and poor public understanding of the actual situation. This dashboard is a direct response to that problem: it provides the tools to put numbers in context, compare them fairly, and understand them across time.

### 7.2 Demonstrating the Limits of Raw Numbers
Every visualization in this dashboard contains at least one lesson about why raw numbers are insufficient:
- Absolute cases → misleading without population normalization
- Fatality rates → misleading without testing context
- Cumulative curves → hide the wave structure visible only in daily data
- Country rankings → change entirely depending on the metric

A user who spends 10 minutes exploring this dashboard comes away with a fundamentally more nuanced understanding of pandemic data than someone who only read headlines.

### 7.3 Technical Contribution
This project demonstrates that a full-featured analytical dashboard can be built without a backend, without a database, and without a paid data subscription. The entire stack is:
- **Free** — D3.js, TopoJSON, and Python's built-in HTTP server are all open source
- **Offline-capable** — once the files are downloaded, no internet connection is required
- **Portable** — the entire application is ~500KB of text files plus the CSV data

This is a meaningful architectural demonstration: not every data visualization project needs React, Node.js, and a cloud database.

### 7.4 A Record of a Historic Moment
The dataset captures the world's pandemic state as of July 27, 2020 — six months in, before vaccines, before the Delta or Omicron variants, before the full second and third waves. The dashboard preserves and visualizes this snapshot with fidelity. It is both an analytical tool and a historical record.

### 7.5 Educational Value
The combination of 8 chart types — geographic, temporal, categorical, relational, hierarchical, and multivariate — makes this project an excellent reference for anyone learning D3.js. Every major chart type used in real-world data journalism is represented. The code is modular, well-structured, and directly readable.

---

## Appendix: Metrics Reference

| Metric | Definition | Unit |
|---|---|---|
| Total Cases | Confirmed positive tests | Count |
| Total Deaths | Deaths attributed to COVID-19 | Count |
| Total Recovered | Patients officially recovered | Count |
| Active Cases | Cases − Deaths − Recovered | Count |
| Serious/Critical | Currently hospitalized in ICU/serious condition | Count |
| Cases per Million | (Total Cases / Population) × 1,000,000 | Rate |
| Deaths per Million | (Total Deaths / Population) × 1,000,000 | Rate |
| Total Tests | All diagnostic tests administered | Count |
| Tests per Million | (Total Tests / Population) × 1,000,000 | Rate |
| Fatality Rate (CFR) | (Total Deaths / Total Cases) × 100 | Percentage |
| Recovery Rate | (Total Recovered / Total Cases) × 100 | Percentage |
| Week-over-Week Change | New cases in past 7 days | Count + % |

---

*Report prepared for the COVID Intelligence Dashboard project.*  
*Data period: January 22, 2020 – July 27, 2020*  
*Data source: Kaggle COVID-19 Dataset (Worldometer compilation)*
