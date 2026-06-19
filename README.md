# COVID Intelligence Dashboard

**Live Demo → [https://hiramustafabaig.github.io/covid-dashboard/](https://hiramustafabaig.github.io/covid-dashboard/)**

An interactive global pandemic data visualization platform built with D3.js v7. Covers 208 countries across 188 days (January 22 – July 27, 2020) using real Kaggle COVID-19 data.

---

## Project Info

| | |
|---|---|
| **Course** | Data Visualization Techniques |
| **Instructor** | Dr. Shaneela Naz |
| **Team** | Hira Baig (SP23-BDS-019) · Omer Bin Dawood (SP23-BDS-041) |
| **Data** | Kaggle COVID-19 Dataset (Worldometer) |
| **Data Period** | Jan 22 – Jul 27, 2020 · 208 countries |
| **GitHub** | [hiramustafabaig](https://github.com/hiramustafabaig) |

---

## Visualizations (9 Charts)

| # | Chart | Type |
|---|-------|------|
| 1 | Global Heatmap | Choropleth Map (D3 + TopoJSON) |
| 2 | Top Affected Nations | Vertical Bar Chart |
| 3 | Distribution Analysis | Donut Chart |
| 4 | Temporal Evolution | Multi-series Line Chart |
| 5 | Multivariate Analysis | Logarithmic Bubble Chart |
| 6 | Fatality Rate Ranking | Horizontal Bar Chart |
| 7 | Hierarchical Impact View | Squarified Treemap |
| 8 | Case Outcome by Region | 100% Stacked Bar Chart |
| 9 | Country Comparison Radar | Spider / Radar Chart |

---

## Tech Stack

- **D3.js v7** — all SVG chart rendering
- **TopoJSON** — world map boundary data
- **HTML5 / CSS3 / Vanilla JS** — no frameworks, no build step
- **CSS Custom Properties** — full dark/light theme system

---

## Data Files

| File | Rows | Description |
|------|------|-------------|
| `data/worldometer_data.csv` | 208 | Country-level snapshot (cases, deaths, tests, population) |
| `data/day_wise.csv` | 188 | Global daily totals (Jan 22 – Jul 27, 2020) |
| `data/country_wise_latest.csv` | 188 | Weekly change supplement per country |

---

## Run Locally

```bash
cd covid-dashboard
python -m http.server 8080
# open http://localhost:8080
```