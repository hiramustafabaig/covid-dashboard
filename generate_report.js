/**
 * COVID Intelligence Dashboard — Project Report Generator
 * Generates a comprehensive Word document for Data Visualization Techniques course
 */

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageNumber, PageBreak, VerticalAlign, TableOfContents
} = require('docx');
const fs = require('fs');
const path = require('path');

// ── Paths ────────────────────────────────────────────────────────────────────
const SS = 'E:/covid-dashboard/screenshots';
const OUT = 'E:/covid-dashboard/COVID_Intelligence_Dashboard_Report.docx';

// ── Helpers ──────────────────────────────────────────────────────────────────
function img(filename, widthPx = 620, heightPx = 400) {
  const fullPath = path.join(SS, filename);
  if (!fs.existsSync(fullPath)) return new Paragraph({ children: [new TextRun({ text: `[Image: ${filename}]`, italics: true, color: '888888' })] });
  const ext = filename.split('.').pop().toLowerCase();
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 120 },
    children: [new ImageRun({
      type: ext,
      data: fs.readFileSync(fullPath),
      transformation: { width: widthPx, height: heightPx },
      altText: { title: filename, description: filename, name: filename }
    })]
  });
}

function caption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 200 },
    children: [new TextRun({ text, size: 18, italics: true, color: '555555' })]
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 180 },
    pageBreakBefore: false,
    children: [new TextRun({ text, bold: true, size: 32, font: 'Arial' })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 26, font: 'Arial' })]
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 180, after: 80 },
    children: [new TextRun({ text, bold: true, size: 23, font: 'Arial' })]
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    spacing: { before: opts.before || 80, after: opts.after || 120 },
    children: [new TextRun({ text, size: opts.size || 22, bold: opts.bold, italics: opts.italics, color: opts.color })]
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: 'bullets', level },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 22 })]
  });
}

function numbered(text, level = 0) {
  return new Paragraph({
    numbering: { reference: 'numbers', level },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 22 })]
  });
}

function divider() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '2563EB', space: 6 } },
    spacing: { before: 120, after: 120 },
    children: []
  });
}

function space(n = 1) {
  return Array(n).fill(0).map(() => new Paragraph({ children: [] }));
}

// ── Table helper ─────────────────────────────────────────────────────────────
const brd = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: brd, bottom: brd, left: brd, right: brd };

function headerRow(cells, widths) {
  return new TableRow({
    tableHeader: true,
    children: cells.map((text, i) => new TableCell({
      borders,
      width: { size: widths[i], type: WidthType.DXA },
      shading: { fill: '1D4ED8', type: ShadingType.CLEAR },
      margins: { top: 100, bottom: 100, left: 120, right: 120 },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 20 })] })]
    }))
  });
}

function dataRow(cells, widths, shade = false) {
  return new TableRow({
    children: cells.map((text, i) => new TableCell({
      borders,
      width: { size: widths[i], type: WidthType.DXA },
      shading: { fill: shade ? 'F0F4FF' : 'FFFFFF', type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: String(text), size: 20 })] })]
    }))
  });
}

// ── Visualization info ────────────────────────────────────────────────────────
const vizInfo = [
  {
    num: 1, title: 'Global Heatmap (Choropleth Map)',
    file: '03_world_map.png', w: 620, h: 360,
    type: 'Geographic Choropleth Map',
    library: 'D3.js v7 + TopoJSON',
    data: 'worldometer_data.csv',
    what: 'A world map where each country is color-coded using the Viridis color scale (purple→teal→yellow) based on the selected metric. Users can switch between 9 metrics and interact via scroll-to-zoom and drag-to-pan.',
    shows: 'The absolute dominance of the USA, Brazil, and India in total case counts is immediately visible. Switching to Cases per Million reveals a very different story — Belgium, Qatar, and Luxembourg appear as hotspots, demonstrating how per-capita normalization completely changes the geographic narrative.',
    why: 'A choropleth map is the most natural way to represent geographically distributed data. It leverages the human brain\'s ability to recognize spatial patterns instantly. We chose Viridis because it is perceptually uniform and colorblind-safe, making it the scientifically preferred palette for continuous data.'
  },
  {
    num: 2, title: 'Top Affected Nations (Bar Chart)',
    file: '05_bar_chart.png', w: 600, h: 370,
    type: 'Vertical Bar Chart',
    library: 'D3.js v7',
    data: 'worldometer_data.csv',
    what: 'A dynamic ranking bar chart showing the Top N countries (10, 15, 20, or 30) sorted by the selected metric. Bars use a blue gradient color scale and animate on load. Country labels rotate at -45 degrees to prevent overlap.',
    shows: 'The extreme skewness of the distribution is clearly visible — the USA\'s 5M cases towers over all others. This chart also reveals that the top 3 countries (USA, Brazil, India) together account for nearly half of all global cases, with a steep drop-off thereafter.',
    why: 'Bar charts are the most effective visualization for ranked categorical comparisons. The gradient coloring (light→dark blue) provides an additional visual encoding of magnitude, reinforcing the rank ordering.'
  },
  {
    num: 3, title: 'Distribution Analysis (Pie/Donut Chart)',
    file: '06_pie_chart.png', w: 600, h: 380,
    type: 'Donut Chart',
    library: 'D3.js v7',
    data: 'worldometer_data.csv',
    what: 'A donut chart showing the proportional share of global confirmed cases by continent. The center displays the global total. Each segment expands on hover, and a side legend shows exact percentages.',
    shows: 'North America accounts for 30.9% of cases despite having a fraction of the world\'s population. The Americas combined (North + South) represent over 54% of global cases as of July 2020. Asia, despite having 60% of the world\'s population, accounts for only 24.5%, revealing effective early containment in many Asian nations.',
    why: 'A donut chart (vs. full pie) reduces the visual distortion inherent in comparing angular areas. The hollow center allows for the global total to be prominently displayed. Continental-level aggregation reveals macro-geographic trends that country-level data obscures.'
  },
  {
    num: 4, title: 'Temporal Evolution Analysis (Line Chart)',
    file: '07_line_chart.png', w: 620, h: 370,
    type: 'Multi-Series Line Chart with Area Fill',
    library: 'D3.js v7',
    data: 'day_wise.csv (188 daily records)',
    what: 'A time-series chart with two display modes: Cumulative (showing total cases, deaths, recovered from Jan 22 to Jul 27, 2020) and Daily New (showing new cases, deaths, recoveries per day). Features time range filters (All, 1Y, 90D, 30D) and an interactive crosshair hover.',
    shows: 'Cumulative mode reveals the exponential growth curve of the first wave — nearly flat until mid-March, then steeply rising. Daily New mode (switching mode) reveals the wave structure: a first peak in mid-April, a brief plateau, and a strong resurgence in June-July indicating the second wave building.',
    why: 'Time series data is most intuitively understood as a line chart. The dual Cumulative/Daily mode is a deliberate design choice: cumulative hides the wave structure that is critical for understanding pandemic dynamics, so offering both modes gives a complete picture.'
  },
  {
    num: 5, title: 'Multivariate Analysis (Bubble Chart)',
    file: '08_bubble_chart.png', w: 620, h: 380,
    type: 'Logarithmic Scatter Plot with Sized/Colored Bubbles',
    library: 'D3.js v7',
    data: 'worldometer_data.csv',
    what: 'A four-variable scatter plot where X-axis = Cases per Million (log), Y-axis = Deaths per Million (log), bubble size = Tests per Million, and bubble color = Continent. Both axes use logarithmic scales to prevent outliers from compressing the data.',
    shows: 'European countries (purple) cluster in the top-right quadrant — high cases AND high deaths per million. Qatar appears far right on X but low on Y (high spread, low mortality — young demographics, strong testing). African/Asian countries with small bubbles show low testing capacity, suggesting actual case burdens are underestimated. The positive correlation between axes confirms that outbreak severity drives mortality.',
    why: 'This is the most analytically sophisticated chart in the dashboard. Four variables encoded simultaneously is only possible with a bubble chart. The logarithmic scale is essential — without it, the USA and Brazil would compress all other data points into an unreadable cluster. This chart directly challenges readers to think critically about what the numbers mean.'
  },
  {
    num: 6, title: 'Fatality Rate Ranking (Horizontal Bar Chart)',
    file: '09_hbar_fatality.png', w: 600, h: 380,
    type: 'Horizontal Bar Chart with Gradient Encoding',
    library: 'D3.js v7',
    data: 'worldometer_data.csv',
    what: 'A horizontal bar chart ranking the top 15 countries by Case Fatality Rate (CFR = Deaths/Cases × 100). The gradient color scale runs from orange (moderate) to red (severe). Percentage labels appear at the end of each bar.',
    shows: 'France (15.5%), UK (15.1%), and Italy (14.1%) show startlingly high CFRs compared to global averages. This is counterintuitive — these are developed nations with strong healthcare. The explanation lies in testing strategy: in early 2020, testing was restricted to severe cases, so mild infections were never counted, artificially inflating the apparent death rate.',
    why: 'Horizontal orientation is superior to vertical for this data because country names vary in length and are more readable horizontally. The orange-to-red gradient reinforces the severity message beyond just bar length, providing dual encoding.'
  },
  {
    num: 7, title: 'Hierarchical Impact View (Treemap)',
    file: '10_treemap.png', w: 620, h: 380,
    type: 'Squarified Treemap (D3 Hierarchy)',
    library: 'D3.js v7',
    data: 'worldometer_data.csv',
    what: 'A nested rectangle layout where the area of each country\'s rectangle is proportional to its total confirmed cases. Countries are grouped and colored by continent. All countries are visible simultaneously in a single view.',
    shows: 'The USA block visually dominates the entire treemap, making the scale of its outbreak unmistakable. The contrast between North America (USA\'s single large green block vs. smaller neighboring nations) and the tight clustering of smaller European nations gives a different visual intuition than bar charts. South Africa stands out in gold as Africa\'s dominant case count.',
    why: 'The treemap is the only chart in the dashboard that makes all 208 countries visible simultaneously. Bar charts can only show the top N. The treemap reveals the full distribution including the long tail of smaller nations, and the nesting naturally shows the continental groupings.'
  },
  {
    num: 8, title: 'Case Outcome by Region (Stacked Bar Chart)',
    file: '11_outcome_chart.png', w: 620, h: 370,
    type: '100% Stacked Horizontal Bar Chart',
    library: 'D3.js v7',
    data: 'worldometer_data.csv',
    what: 'A 100% normalized stacked bar chart showing for each continent the share of confirmed cases that resulted in Recovery (green), remained Active (orange), or ended in Death (red). Sorted by recovery rate.',
    shows: 'Asia leads with a 75% recovery rate — the highest globally, reflecting early containment and treatment experience from China and South Korea. Europe shows the highest death proportion at ~7% of its confirmed cases. Australia/Oceania has a notably high Active % (41%) indicating cases were still growing at the snapshot date. This chart exposes stark outcome disparities that raw case counts completely hide.',
    why: 'A 100% stacked bar normalizes each continent to the same width, making proportional comparisons fair regardless of absolute case counts. Without normalization, Asia would dwarf Oceania and the outcome patterns for smaller continents would be invisible.'
  },
  {
    num: 9, title: 'Country Comparison Radar (Spider/Radar Chart)',
    file: '12_radar_chart.png', w: 600, h: 400,
    type: 'Spider / Radar Chart',
    library: 'D3.js v7',
    data: 'worldometer_data.csv',
    what: 'A radar chart comparing any two selected countries across 6 normalized metrics: Cases per Million, Deaths per Million, Tests per Million, Total Cases, Total Deaths, and Fatality %. Each metric is normalized to [0,1] relative to the global maximum. Default comparison: USA vs. India.',
    shows: 'USA (blue) has a very large polygon — high on all absolute metrics and moderately high on per-capita ones. India (red, July 2020) has a much smaller polygon, particularly on Tests/Million and per-capita measures, reflecting that India\'s second wave had not yet peaked. The shape of each country\'s polygon is its unique pandemic "fingerprint" at this point in time.',
    why: 'Radar charts are ideal for multi-dimensional comparison between a small number of entities. Comparing 6 metrics across 2 countries simultaneously in a bar chart would require either 12 bars (hard to compare) or 6 separate charts. The radar format reveals the overall profile shape instantly.'
  }
];

// ── Build document ────────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]
      },
      {
        reference: 'numbers',
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]
      }
    ]
  },

  styles: {
    default: {
      document: { run: { font: 'Arial', size: 22 } }
    },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 34, bold: true, font: 'Arial', color: '1D4ED8' },
        paragraph: { spacing: { before: 480, after: 200 }, outlineLevel: 0,
          border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: '1D4ED8', space: 4 } } }
      },
      {
        id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: 'Arial', color: '1E40AF' },
        paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 1 }
      },
      {
        id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: 'Arial', color: '2563EB' },
        paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 2 }
      }
    ]
  },

  sections: [
    // ── SECTION 1: Cover Page ─────────────────────────────────────────────────
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: [
        ...space(4),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: 'BAHRIA UNIVERSITY, ISLAMABAD', size: 24, bold: true, color: '1D4ED8' })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 },
          children: [new TextRun({ text: 'Department of Computer Science', size: 22, color: '374151' })]
        }),

        divider(),

        ...space(2),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
          children: [new TextRun({ text: 'PROJECT REPORT', size: 26, bold: true, color: '6B7280', allCaps: true })]
        }),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80, after: 200 },
          children: [new TextRun({ text: 'COVID Intelligence Dashboard', size: 48, bold: true, font: 'Arial', color: '111827' })]
        }),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80, after: 480 },
          children: [new TextRun({ text: 'An Interactive Global Pandemic Data Visualization Platform', size: 26, italics: true, color: '4B5563' })]
        }),

        ...space(2),
        divider(),
        ...space(2),

        // Details table
        new Table({
          width: { size: 7000, type: WidthType.DXA },
          columnWidths: [2600, 4400],
          rows: [
            new TableRow({ children: [
              new TableCell({ borders, width: { size: 2600, type: WidthType.DXA }, shading: { fill: 'EFF6FF', type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 160, right: 160 },
                children: [new Paragraph({ children: [new TextRun({ text: 'Submitted By', bold: true, size: 22, color: '1D4ED8' })] })] }),
              new TableCell({ borders, width: { size: 4400, type: WidthType.DXA }, shading: { fill: 'FFFFFF', type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 160, right: 160 },
                children: [
                  new Paragraph({ children: [new TextRun({ text: 'Hira Baig (SP23-BDS-019)', size: 22, bold: true })] }),
                  new Paragraph({ children: [new TextRun({ text: 'Omer Bin Dawood (SP23-BDS-041)', size: 22, bold: true })] }),
                ] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders, width: { size: 2600, type: WidthType.DXA }, shading: { fill: 'EFF6FF', type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 160, right: 160 },
                children: [new Paragraph({ children: [new TextRun({ text: 'Course', bold: true, size: 22, color: '1D4ED8' })] })] }),
              new TableCell({ borders, width: { size: 4400, type: WidthType.DXA }, shading: { fill: 'FFFFFF', type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 160, right: 160 },
                children: [new Paragraph({ children: [new TextRun({ text: 'Data Visualization Techniques', size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders, width: { size: 2600, type: WidthType.DXA }, shading: { fill: 'EFF6FF', type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 160, right: 160 },
                children: [new Paragraph({ children: [new TextRun({ text: 'Submitted To', bold: true, size: 22, color: '1D4ED8' })] })] }),
              new TableCell({ borders, width: { size: 4400, type: WidthType.DXA }, shading: { fill: 'FFFFFF', type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 160, right: 160 },
                children: [new Paragraph({ children: [new TextRun({ text: 'Dr. Shaneela Naz', size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders, width: { size: 2600, type: WidthType.DXA }, shading: { fill: 'EFF6FF', type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 160, right: 160 },
                children: [new Paragraph({ children: [new TextRun({ text: 'Semester', bold: true, size: 22, color: '1D4ED8' })] })] }),
              new TableCell({ borders, width: { size: 4400, type: WidthType.DXA }, shading: { fill: 'FFFFFF', type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 160, right: 160 },
                children: [new Paragraph({ children: [new TextRun({ text: 'Spring 2023', size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders, width: { size: 2600, type: WidthType.DXA }, shading: { fill: 'EFF6FF', type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 160, right: 160 },
                children: [new Paragraph({ children: [new TextRun({ text: 'Date', bold: true, size: 22, color: '1D4ED8' })] })] }),
              new TableCell({ borders, width: { size: 4400, type: WidthType.DXA }, shading: { fill: 'FFFFFF', type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 160, right: 160 },
                children: [new Paragraph({ children: [new TextRun({ text: 'June 2026', size: 22 })] })] })
            ]}),
          ]
        }),

        ...space(4),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'Live: https://omerbindawood.github.io/covid-dashboard/  |  208 Countries  |  9 Visualizations  |  D3.js v7', size: 18, italics: true, color: '6B7280' })]
        }),

        new Paragraph({ children: [new PageBreak()] })
      ]
    },

    // ── SECTION 2: Main Report ────────────────────────────────────────────────
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1260, bottom: 1440, left: 1260 }
        }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: '1D4ED8', space: 4 } },
            children: [
              new TextRun({ text: 'COVID Intelligence Dashboard  |  Data Visualization Techniques', size: 18, color: '4B5563' }),
              new TextRun({ text: '\tHira Baig & Omer Bin Dawood', size: 18, color: '4B5563' })
            ],
            tabStops: [{ type: 'right', position: 8500 }]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 2, color: 'CCCCCC', space: 4 } },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Page ', size: 18, color: '6B7280' }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '6B7280' }),
              new TextRun({ text: ' of ', size: 18, color: '6B7280' }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: '6B7280' })
            ]
          })]
        })
      },

      children: [
        // ── Table of Contents ──────────────────────────────────────────────
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: 'Table of Contents', bold: true, size: 34, font: 'Arial', color: '1D4ED8' })]
        }),
        new TableOfContents('Table of Contents', { hyperlink: true, headingStyleRange: '1-3' }),
        new Paragraph({ children: [new PageBreak()] }),

        // ── 1. Abstract ────────────────────────────────────────────────────
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '1. Abstract', bold: true, size: 34, font: 'Arial', color: '1D4ED8' })] }),
        para('The COVID Intelligence Dashboard is a fully client-side, browser-based analytical platform built using D3.js v7, HTML5, and CSS3. It transforms three curated CSV files from the Kaggle COVID-19 Worldometer dataset into nine interactive visualizations covering 208 countries and 188 days of pandemic data (January 22 – July 27, 2020). The dashboard provides comprehensive insights into the global spread, mortality patterns, testing disparities, and recovery trajectories of the COVID-19 pandemic through a range of chart types including a choropleth world map, bar charts, a donut chart, a time-series line chart, a multivariate bubble chart, horizontal bar chart, treemap, 100% stacked bar chart, and a multi-dimensional radar chart. The entire application runs without any backend infrastructure, making it portable, offline-capable, and directly reproducible by any reviewer.'),

        new Paragraph({ children: [new PageBreak()] }),

        // ── 2. Introduction ────────────────────────────────────────────────
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '2. Introduction', bold: true, size: 34, font: 'Arial', color: '1D4ED8' })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '2.1 Background', bold: true, size: 28, font: 'Arial', color: '1E40AF' })] }),
        para('The COVID-19 pandemic was the defining global event of the early 2020s. Within weeks of the World Health Organization declaring it a pandemic on March 11, 2020, the world was drowning in data: daily case counts, death tolls, recovery rates, and testing figures from nearly every country on Earth. This abundance of raw data, however, did not automatically translate into understanding. Numbers cited without context — "1 million cases," "15% fatality rate," "Europe hardest hit" — often created more confusion than clarity.'),
        para('The fundamental challenge of the pandemic was not a lack of data but a lack of effective data communication. People needed tools that could take enormous, multi-dimensional datasets and present them in forms that revealed meaningful patterns: Where was the pandemic most severe? Were deaths rising or falling? Were testing disparities masking the true scale of the outbreak? How did countries compare not just in raw numbers but on a per-capita basis?'),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '2.2 Why We Chose This Project', bold: true, size: 28, font: 'Arial', color: '1E40AF' })] }),
        para('We chose this project for several interconnected reasons:'),
        bullet('Real-world significance: The COVID-19 pandemic is one of the most consequential events in modern history. Visualizing its data carries genuine intellectual and social weight beyond a typical academic exercise.'),
        bullet('Visualization breadth: The multi-dimensional nature of pandemic data — geographic, temporal, categorical, relational, and hierarchical — provided a natural justification for deploying all major chart types taught in the Data Visualization Techniques course.'),
        bullet('Critical thinking about data: Pandemic data is a perfect vehicle for teaching why visualization choices matter. The same data looks completely different depending on whether you use absolute counts or per-capita rates, whether you use log or linear scales, and whether you show cumulative or daily figures.'),
        bullet('Technical ambition: Building a dashboard of this scope entirely client-side with D3.js, without any backend or paid data subscription, demonstrates mastery of both data visualization principles and modern web technologies.'),
        bullet('Public interest: This project could genuinely help non-technical readers understand pandemic data better — a form of civic contribution that extends beyond the classroom.'),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '2.3 Project Objectives', bold: true, size: 28, font: 'Arial', color: '1E40AF' })] }),
        numbered('Build a fully interactive, browser-based COVID-19 data visualization dashboard using D3.js v7.'),
        numbered('Implement at least 8 distinct chart types covering geographic, temporal, categorical, hierarchical, and multivariate data.'),
        numbered('Load and process real-world pandemic data from the Kaggle COVID-19 dataset without any backend infrastructure.'),
        numbered('Demonstrate how different visualization choices (absolute vs. per-capita, linear vs. log scale, cumulative vs. daily) change the story data tells.'),
        numbered('Create a professionally designed, fully responsive, dark/light mode dashboard suitable for public presentation.'),

        new Paragraph({ children: [new PageBreak()] }),

        // ── 3. Data Sources ────────────────────────────────────────────────
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '3. Data Sources', bold: true, size: 34, font: 'Arial', color: '1D4ED8' })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '3.1 Primary Source', bold: true, size: 28, font: 'Arial', color: '1E40AF' })] }),
        para('All data comes from the Kaggle COVID-19 Dataset compiled from Worldometers.info, one of the most widely cited real-time pandemic tracking sites. This dataset was used by researchers, journalists, and public health agencies throughout the pandemic and represents a gold-standard source for the period it covers.'),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '3.2 Files Used', bold: true, size: 28, font: 'Arial', color: '1E40AF' })] }),

        new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: [2500, 800, 1800, 3926],
          rows: [
            headerRow(['File', 'Rows', 'Period', 'Purpose'], [2500, 800, 1800, 3926]),
            dataRow(['worldometer_data.csv', '208', 'Jul 27, 2020', 'Country-level snapshot: cases, deaths, recovered, tests, critical, per-million rates, population'], [2500, 800, 1800, 3926], false),
            dataRow(['day_wise.csv', '188', 'Jan 22 – Jul 27, 2020', 'Global daily totals: confirmed, deaths, recovered, active, new cases, new deaths'], [2500, 800, 1800, 3926], true),
            dataRow(['country_wise_latest.csv', '188', 'Jul 27, 2020', 'Weekly change supplement: 1-week case change count and percentage per country'], [2500, 800, 1800, 3926], false),
          ]
        }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '3.3 Key Metrics Available', bold: true, size: 28, font: 'Arial', color: '1E40AF' })] }),

        new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: [2500, 3000, 3526],
          rows: [
            headerRow(['Metric', 'Formula', 'Significance'], [2500, 3000, 3526]),
            dataRow(['Total Confirmed', 'Direct count', 'Absolute scale of outbreak'], [2500, 3000, 3526], false),
            dataRow(['Total Deaths', 'Direct count', 'Mortality burden'], [2500, 3000, 3526], true),
            dataRow(['Total Recovered', 'Direct count', 'Treatment success'], [2500, 3000, 3526], false),
            dataRow(['Case Fatality Rate', 'Deaths / Cases × 100', 'Apparent mortality rate (testing-dependent)'], [2500, 3000, 3526], true),
            dataRow(['Cases per Million', 'Cases / Population × 1M', 'Population-normalized burden (fair comparison)'], [2500, 3000, 3526], false),
            dataRow(['Deaths per Million', 'Deaths / Population × 1M', 'Population-normalized mortality'], [2500, 3000, 3526], true),
            dataRow(['Tests per Million', 'Tests / Population × 1M', 'Testing infrastructure indicator'], [2500, 3000, 3526], false),
          ]
        }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '3.4 Files Removed', bold: true, size: 28, font: 'Arial', color: '1E40AF' })] }),
        para('During data preparation, the following files were identified as redundant or unusable and removed:'),
        bullet('usa_county_wise.csv (69 MB) — US county-level data; too granular and too large for a browser-based global dashboard'),
        bullet('covid_19_clean_complete.csv (3.3 MB) — redundant with the three selected files'),
        bullet('full_grouped.csv (1.8 MB) — same data in a different grouping format'),
        bullet('covid_data.csv and covid_ts_data.csv — both empty files'),

        new Paragraph({ children: [new PageBreak()] }),

        // ── 4. Technical Architecture ──────────────────────────────────────
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '4. Technical Architecture', bold: true, size: 34, font: 'Arial', color: '1D4ED8' })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '4.1 Technology Stack', bold: true, size: 28, font: 'Arial', color: '1E40AF' })] }),

        new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: [2200, 2200, 4626],
          rows: [
            headerRow(['Layer', 'Technology', 'Role'], [2200, 2200, 4626]),
            dataRow(['Markup', 'HTML5', 'Semantic page structure, all chart containers and controls'], [2200, 2200, 4626], false),
            dataRow(['Styling', 'CSS3 + Custom Properties', 'Full dark/light theme, responsive layout, animations'], [2200, 2200, 4626], true),
            dataRow(['Logic', 'JavaScript (ES2020)', 'Data loading, state management, chart orchestration'], [2200, 2200, 4626], false),
            dataRow(['Visualization', 'D3.js version 7', 'All SVG chart rendering, scales, axes, transitions'], [2200, 2200, 4626], true),
            dataRow(['Geography', 'TopoJSON (Natural Earth)', 'World map boundary data for the choropleth map'], [2200, 2200, 4626], false),
            dataRow(['Data Transport', 'Python http.server', 'Local static file server enabling CSV loading via fetch'], [2200, 2200, 4626], true),
          ]
        }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '4.2 File Structure', bold: true, size: 28, font: 'Arial', color: '1E40AF' })] }),
        para('The project follows a clean separation of concerns:'),
        bullet('index.html — Application shell, all chart containers, control panel, navigation, and section layout'),
        bullet('css/style.css — Complete theme system using CSS custom properties for dark/light mode switching'),
        bullet('js/app.js — Data loading pipeline, global state management, control event handlers, statistics computation'),
        bullet('js/charts.js — All nine D3.js chart rendering functions, each independently callable'),
        bullet('data/ — The three CSV data files'),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '4.3 Data Processing Pipeline', bold: true, size: 28, font: 'Arial', color: '1E40AF' })] }),
        para('All three CSV files are loaded in parallel using Promise.all() and D3\'s d3.csv() function, eliminating sequential loading delays. Once loaded, data is normalized through the following transformations:'),
        numbered('Type coercion: All numeric fields cast from string to integer or float using parseInt() and parseFloat()'),
        numbered('Country code mapping: 180+ country names mapped to ISO 3166-1 alpha-2 codes for choropleth rendering'),
        numbered('Cross-file joining: Week-over-week change data from country_wise_latest.csv merged into the main country records by country name'),
        numbered('Date parsing: day_wise.csv dates parsed into JavaScript Date objects for D3 time scales'),
        numbered('Derived metrics: Fatality rate, recovery rate, and Pearson correlation computed at runtime from the raw fields'),

        new Paragraph({ children: [new PageBreak()] }),

        // ── 5. Dashboard Overview ──────────────────────────────────────────
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '5. Dashboard Overview', bold: true, size: 34, font: 'Arial', color: '1D4ED8' })] }),
        para('The dashboard is organized into four main sections accessible via the navigation bar: Dashboard (main visualizations), Insights (analytical findings), Analytics (statistical metrics), and About (project information). The hero landing section displays four global KPI cards computed live from the CSV data.'),

        img('01_hero.png', 620, 380),
        caption('Figure 1: Dashboard Hero Section — Global KPI Cards (19.2M Cases, 713K Deaths, 63% Recovery Rate, 208 Countries)'),

        img('02_stats_controls.png', 620, 380),
        caption('Figure 2: Interactive Control Panel — Metric Selector, Region Filter, Top N Countries, Animation Toggle, and CSV Export'),

        new Paragraph({ children: [new PageBreak()] }),

        // ── 6. Visualizations ──────────────────────────────────────────────
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '6. Visualizations', bold: true, size: 34, font: 'Arial', color: '1D4ED8' })] }),
        para('The dashboard implements nine distinct visualization types. Each was chosen to reveal a different dimension of the data that the others cannot show. The following sections document each chart individually.'),

        // Generate all 9 visualization sections
        ...vizInfo.flatMap((v, idx) => [
          new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: `6.${v.num} ${v.title}`, bold: true, size: 28, font: 'Arial', color: '1E40AF' })] }),

          new Table({
            width: { size: 9026, type: WidthType.DXA },
            columnWidths: [2000, 7026],
            rows: [
              dataRow(['Chart Type', v.type], [2000, 7026], false),
              dataRow(['Library', v.library], [2000, 7026], true),
              dataRow(['Data Source', v.data], [2000, 7026], false),
            ]
          }),

          new Paragraph({ spacing: { before: 160, after: 60 } }),
          img(v.file, v.w, v.h),
          caption(`Figure ${v.num + 2}: ${v.title}`),

          new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: 'What It Shows', bold: true, size: 24, font: 'Arial', color: '2563EB' })] }),
          para(v.what),

          new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: 'Key Insights', bold: true, size: 24, font: 'Arial', color: '2563EB' })] }),
          para(v.shows),

          new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: 'Why This Chart Type Was Chosen', bold: true, size: 24, font: 'Arial', color: '2563EB' })] }),
          para(v.why),

          // page break after each viz except last
          ...(idx < vizInfo.length - 1 ? [new Paragraph({ children: [new PageBreak()] })] : [])
        ]),

        new Paragraph({ children: [new PageBreak()] }),

        // ── 7. Key Findings ────────────────────────────────────────────────
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '7. Key Findings & Insights', bold: true, size: 34, font: 'Arial', color: '1D4ED8' })] }),

        img('13_insights.png', 620, 370),
        caption('Figure 12: Key Discoveries Section — Data-Driven Insights Panel'),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: 'Finding 1: Per-Capita Metrics Completely Reverse Country Rankings', bold: true, size: 28, font: 'Arial', color: '1E40AF' })] }),
        para('When switching the choropleth map or bar chart from absolute case counts to Cases per Million, the ranking of countries changes dramatically. Belgium, Luxembourg, Qatar, and Bahrain top the per-capita chart — countries that are nearly invisible on the absolute count charts. The USA, which dominates absolute rankings, drops to mid-table on per-capita measures. This single observation demonstrates why population normalization is essential for any honest cross-country comparison.'),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: 'Finding 2: Europe\'s High Fatality Rates Reflect Testing Strategy, Not Healthcare Quality', bold: true, size: 28, font: 'Arial', color: '1E40AF' })] }),
        para('France (15.5%), UK (15.1%), Italy (14.1%), and Belgium (13.9%) show the highest case fatality rates in the world. This is counterintuitive for nations with advanced healthcare systems. The explanation: in early 2020, testing was severely rationed to hospitalized patients only. The confirmed case count (denominator) was artificially small, inflating the apparent death rate. Countries with broader early testing programs, like Germany and South Korea, showed CFRs of 2-4% over the same period.'),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: 'Finding 3: The Americas Drove the First Wave\'s Second Half', bold: true, size: 28, font: 'Arial', color: '1E40ED' })] }),
        para('The pie chart shows North and South America together accounting for approximately 55% of global cases by July 2020. The line chart confirms the temporal dynamics: while the initial outbreak (February–April) was centered in Asia and Europe, the global curve re-accelerated in June–July as the USA, Brazil, and Mexico surged. The pandemic was not a synchronized global event — it was a rolling series of regional outbreaks, each with different timelines.'),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: 'Finding 4: Testing Capacity Spans Three Orders of Magnitude', bold: true, size: 28, font: 'Arial', color: '1E40AF' })] }),
        para('The bubble chart reveals that tests per million vary from under 100 in some African nations to over 300,000 in a few Gulf states. This matters enormously: a country conducting few tests will report few cases, not because the disease isn\'t there but because it isn\'t being measured. The Case Outcome chart shows Asia\'s 75% recovery rate — partly genuine, but also partly a reflection that mild cases were not being detected in some regions during this period.'),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: 'Finding 5: The Pandemic\'s Course Was Asynchronous Globally', bold: true, size: 28, font: 'Arial', color: '1E40AF' })] }),
        para('The radar chart default comparison (USA vs. India) illustrates a crucial temporal point: India\'s polygon is dramatically smaller than the USA\'s as of July 2020. India would go on to experience catastrophic second and third waves in 2021 that would make these numbers appear minor. The dashboard captures a specific historical moment, and the radar chart makes the asynchronous nature of the global pandemic visually explicit.'),

        new Paragraph({ children: [new PageBreak()] }),

        // ── 8. Statistical Analysis ────────────────────────────────────────
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '8. Statistical Analysis', bold: true, size: 34, font: 'Arial', color: '1D4ED8' })] }),
        para('The dashboard computes and displays the following statistical measures from the live data:'),

        new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: [2800, 2200, 4026],
          rows: [
            headerRow(['Metric', 'Value (July 2020)', 'Interpretation'], [2800, 2200, 4026]),
            dataRow(['Global Confirmed Cases', '19.2 Million', 'Scale of the first wave across 208 countries'], [2800, 2200, 4026], false),
            dataRow(['Global Deaths', '713,000', 'Approximately 3.7% of confirmed cases'], [2800, 2200, 4026], true),
            dataRow(['Global Recovery Rate', '63%', 'Majority of confirmed cases had recovered'], [2800, 2200, 4026], false),
            dataRow(['Peak Daily New Cases', '~230,000', 'Reached on July 27, 2020 (dataset end date)'], [2800, 2200, 4026], true),
            dataRow(['Deaths vs Cases (Pearson r)', '~0.97', 'Near-perfect linear correlation globally'], [2800, 2200, 4026], false),
            dataRow(['Highest Cases/Million', 'Qatar (>40,000)', 'Qatar had extremely high per-capita burden'], [2800, 2200, 4026], true),
            dataRow(['Highest CFR', 'France (15.5%)', 'Driven by limited early testing, not worse outcomes'], [2800, 2200, 4026], false),
            dataRow(['Mean Cases per Country', '~92,000', 'Extremely skewed distribution (USA: 5M)'], [2800, 2200, 4026], true),
          ]
        }),

        new Paragraph({ children: [new PageBreak()] }),

        // ── 9. How We Built It ─────────────────────────────────────────────
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '9. How We Built It', bold: true, size: 34, font: 'Arial', color: '1D4ED8' })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '9.1 Development Process', bold: true, size: 28, font: 'Arial', color: '1E40AF' })] }),
        numbered('Data audit: Examined all available data files, identified quality issues (empty files, redundant files, overly large files), and selected the three optimal CSVs.'),
        numbered('Architecture design: Structured the codebase into three separate files — index.html (structure), style.css (presentation), app.js + charts.js (behavior) — following the separation of concerns principle.'),
        numbered('Data pipeline: Wrote the parallel CSV loading and normalization pipeline, including ISO country code mapping for 180+ countries.'),
        numbered('Chart implementation: Implemented each chart as an independent rendering function, making them reusable and independently testable.'),
        numbered('Theming system: Built a CSS custom properties-based dark/light theme that automatically propagates to all SVG charts via getComputedStyle() calls.'),
        numbered('Interactivity layer: Added zoom/pan (choropleth), sort toggle (bar chart), mode switching (line chart), country selectors (radar), and tooltips across all charts.'),
        numbered('Polish and fixes: Resolved text overlap in treemap, pie chart legend overflow, dark mode SVG text visibility, and bar chart label rotation issues.'),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '9.2 Key Technical Decisions', bold: true, size: 28, font: 'Arial', color: '1E40AF' })] }),
        bullet('No build step: The entire application runs as plain HTML/CSS/JS files. No webpack, npm, or transpilation required. Any reviewer can run it with a single Python command.'),
        bullet('CSS variables for theming: All colors are CSS custom properties. D3 chart code reads these at render time, so charts automatically update when the theme toggles.'),
        bullet('Logarithmic scales in the bubble chart: Essential to prevent the USA and Brazil from compressing all other data points. Linear scale made the chart unreadable.'),
        bullet('Coordinate-based clipPath IDs in treemap: Resolved a critical bug where index-based IDs mismatched when the filtered selection didn\'t align with the original array.'),
        bullet('Parallel CSV loading: Using Promise.all() rather than sequential await cuts load time by roughly 65%.'),
        bullet('Dynamic color domains: Each metric has its own maximum value, so the choropleth color scale rescales automatically rather than being fixed to one metric\'s range.'),

        new Paragraph({ children: [new PageBreak()] }),

        // ── 10. What We Learned ────────────────────────────────────────────
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '10. What We Learned', bold: true, size: 34, font: 'Arial', color: '1D4ED8' })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '10.1 Technical Learnings', bold: true, size: 28, font: 'Arial', color: '1E40AF' })] }),
        bullet('D3.js v7 API: Mastered D3\'s data join pattern, scale types (linear, log, band, time, sequential), axis configuration, and transition animations for all major chart types.'),
        bullet('SVG coordinate system: Learned how SVG\'s top-left origin and the need for explicit transform attributes differ from CSS layout, and how to correctly position elements within margins.'),
        bullet('Geographic projections: Understood the Mercator projection, TopoJSON feature extraction, and how to map ISO numeric country codes to ISO-2 codes for data joining.'),
        bullet('CSS custom properties: Learned how to build a complete theming system using CSS variables that propagate dynamically to both HTML elements and D3-generated SVG.'),
        bullet('Promise-based async data loading: Implemented parallel file loading, error handling, and the loading/error state UI pattern for async operations.'),
        bullet('Data normalization: Learned the importance of type coercion, missing value handling, and cross-file joining when working with real-world CSV data.'),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '10.2 Visualization Design Learnings', bold: true, size: 28, font: 'Arial', color: '1E40AF' })] }),
        bullet('Scale choice matters enormously: Using a linear scale in the bubble chart compressed 80% of countries into an unreadable cluster. The log scale was not just a stylistic choice — it was the difference between a useful and a useless chart.'),
        bullet('Per-capita normalization changes the story: The same dataset tells completely different stories about which countries were most affected depending on whether you use absolute or per-million figures.'),
        bullet('Dual encoding reinforces understanding: Adding gradient coloring to bar charts (in addition to bar height) and bubble sizing (in addition to axis position) helps viewers process the data more quickly.'),
        bullet('Contextual tooltips add depth: Showing secondary metrics (fatality rate, cases/million) in hover tooltips allows the charts to carry more information density without visual clutter.'),
        bullet('Mode switching is powerful: The Cumulative/Daily New toggle on the line chart reveals the wave structure of the pandemic that is invisible in cumulative mode — a powerful lesson about how aggregation can hide important patterns.'),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '10.3 Domain Knowledge Gained', bold: true, size: 28, font: 'Arial', color: '1E40AF' })] }),
        bullet('Case Fatality Rate is unreliable without testing context: High CFR (like France\'s 15.5%) tells you more about testing strategy than about healthcare quality.'),
        bullet('Pandemic dynamics are asynchronous: Different regions hit their peaks at very different times, meaning global aggregates can hide regional crises and recoveries.'),
        bullet('Data quality determines insight quality: Empty files, inconsistent country names, and mixed data types in raw CSVs required careful preprocessing before any visualization was possible.'),

        new Paragraph({ children: [new PageBreak()] }),

        // ── 11. Benefits ──────────────────────────────────────────────────
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '11. Benefits & Applications', bold: true, size: 34, font: 'Arial', color: '1D4ED8' })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '11.1 Educational Benefits', bold: true, size: 28, font: 'Arial', color: '1E40AF' })] }),
        bullet('Demonstrates all major D3.js chart types in one cohesive application, making it an excellent reference for learning data visualization.'),
        bullet('Shows how to handle real-world messy CSV data including missing values, type coercion, and cross-file joining.'),
        bullet('Illustrates the importance of scale choice, normalization, and aggregation level on data interpretation.'),
        bullet('Serves as a complete example of a professional dark/light themed, responsive web application built without frameworks.'),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '11.2 Public Health Benefits', bold: true, size: 28, font: 'Arial', color: '1E40AF' })] }),
        bullet('Helps non-technical audiences understand pandemic statistics through visual exploration rather than raw tables.'),
        bullet('Exposes the limitations of raw case counts and demonstrates why per-capita and testing-adjusted metrics matter.'),
        bullet('Preserves a historical record of the first wave of COVID-19 in an easily navigable interactive format.'),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '11.3 Technical Benefits', bold: true, size: 28, font: 'Arial', color: '1E40AF' })] }),
        bullet('Fully offline-capable: once files are downloaded, no internet connection is required.'),
        bullet('Zero infrastructure: runs on a simple Python http.server, no cloud services, databases, or API keys needed.'),
        bullet('Portable: the entire project is approximately 500KB of text files plus CSV data, making it trivially distributable.'),
        bullet('Exportable: the built-in CSV export function allows users to download the normalized dataset with all computed fields for further analysis.'),

        new Paragraph({ children: [new PageBreak()] }),

        // ── 12. Challenges ─────────────────────────────────────────────────
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '12. Challenges Faced', bold: true, size: 34, font: 'Arial', color: '1D4ED8' })] }),

        new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: [3200, 5826],
          rows: [
            headerRow(['Challenge', 'Solution'], [3200, 5826]),
            dataRow(['Original project used deprecated disease.sh API', 'Completely replaced with Kaggle CSV files loaded via d3.csv()'], [3200, 5826], false),
            dataRow(['Worldometer CSV has "Serious,Critical" as a quoted column name', 'Accessed via r[\'Serious,Critical\'] with the full comma in the key string'], [3200, 5826], true),
            dataRow(['Treemap clipPath IDs mismatched on filtered selections', 'Switched from index-based to coordinate-based IDs: tc-${x0}-${y0}'], [3200, 5826], false),
            dataRow(['SVG text invisible in dark mode', 'Replaced all hardcoded hex colors with CSS custom properties via cssVar()'], [3200, 5826], true),
            dataRow(['Pie chart legend overflowing container', 'Redesigned with legendReserve layout: pie area = total width minus legend space'], [3200, 5826], false),
            dataRow(['Bar chart country labels overlapping', 'Applied -45 degree rotation and increased bottom margin to 130px'], [3200, 5826], true),
            dataRow(['180+ country name variations between CSV and TopoJSON', 'Built a comprehensive countryNameToISO2 mapping object covering all variations'], [3200, 5826], false),
            dataRow(['Bubble chart outliers compressing data', 'Applied logarithmic scales on both axes, filtering countries with <5000 cases'], [3200, 5826], true),
          ]
        }),

        new Paragraph({ children: [new PageBreak()] }),

        // ── 13. Conclusion ─────────────────────────────────────────────────
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '13. Conclusion', bold: true, size: 34, font: 'Arial', color: '1D4ED8' })] }),
        para('The COVID Intelligence Dashboard demonstrates that a powerful, multi-faceted data visualization platform can be built entirely with open-source web technologies and publicly available data, without any backend infrastructure or paid services. By combining nine different chart types across geographic, temporal, categorical, hierarchical, and multivariate dimensions, the dashboard reveals pandemic patterns that would be impossible to perceive from raw data tables alone.'),
        para('The most important lesson of this project is that how you visualize data is just as important as what data you have. The same dataset — 208 countries, 188 days — tells radically different stories depending on whether you use absolute or per-capita measures, linear or logarithmic scales, cumulative or daily figures, and which chart type you choose to encode the information. Each visualization in this dashboard was selected specifically because it reveals something that the others cannot.'),
        para('Beyond its technical accomplishments, this project serves as a record of a historic moment. The data captures the COVID-19 pandemic at the end of its first global wave — July 27, 2020 — before vaccines, before variants, and before the full scale of what was coming became apparent. The 19.2 million cases and 713,000 deaths represented in this dashboard are, in retrospect, only the beginning. Visualizing that moment clearly and honestly is both an intellectual exercise and an act of historical documentation.'),
        para('This project has deepened our understanding of D3.js, data processing pipelines, visualization design principles, and the specific domain of public health data. We are confident that the skills developed here — handling real-world CSV data, building interactive multi-chart dashboards, and making principled design decisions about visualization types and scales — will remain valuable throughout our careers in data science.'),

        new Paragraph({ children: [new PageBreak()] }),

        // ── 14. Footer Screenshot ─────────────────────────────────────────
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '14. Project Credits & Attribution', bold: true, size: 34, font: 'Arial', color: '1D4ED8' })] }),

        img('14_footer.png', 580, 280),
        caption('Figure 13: Dashboard Footer — Project Credits and Data Attribution'),

        ...space(1),

        new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: [3000, 6026],
          rows: [
            dataRow(['Project Title', 'COVID Intelligence Dashboard'], [3000, 6026], false),
            dataRow(['Live URL', 'https://omerbindawood.github.io/covid-dashboard/'], [3000, 6026], true),
            dataRow(['Course', 'Data Visualization Techniques'], [3000, 6026], true),
            dataRow(['Instructor', 'Dr. Shaneela Naz'], [3000, 6026], false),
            dataRow(['Team Member 1', 'Hira Baig — SP23-BDS-019'], [3000, 6026], true),
            dataRow(['Team Member 2', 'Omer Bin Dawood — SP23-BDS-041'], [3000, 6026], false),
            dataRow(['Data Source', 'Kaggle COVID-19 Dataset (Worldometer compilation)'], [3000, 6026], true),
            dataRow(['Data Period', 'January 22, 2020 – July 27, 2020'], [3000, 6026], false),
            dataRow(['Countries Covered', '208 countries'], [3000, 6026], true),
            dataRow(['Visualizations', '9 interactive chart types'], [3000, 6026], false),
            dataRow(['Technology', 'D3.js v7, HTML5, CSS3, JavaScript ES2020, TopoJSON'], [3000, 6026], true),
          ]
        }),

        new Paragraph({ children: [new PageBreak()] }),

        // ── 15. References ─────────────────────────────────────────────────
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '15. References', bold: true, size: 34, font: 'Arial', color: '1D4ED8' })] }),
        numbered('Bostock, M. (2023). D3.js: Data-Driven Documents. Version 7. https://d3js.org'),
        numbered('Worldometers. (2020). COVID-19 Coronavirus Pandemic Statistics. https://www.worldometers.info/coronavirus/'),
        numbered('Kaggle. (2020). COVID-19 Dataset. https://www.kaggle.com/datasets/imdevskp/corona-virus-report'),
        numbered('Natural Earth. (2020). Natural Earth 110m Cultural Vectors. https://www.naturalearthdata.com'),
        numbered('TopoJSON. (2023). TopoJSON v3. https://github.com/topojson/topojson'),
        numbered('Cairo, A. (2016). The Truthful Art: Data, Charts, and Maps for Communication. New Riders.'),
        numbered('Munzner, T. (2014). Visualization Analysis and Design. CRC Press.'),
        numbered('World Health Organization. (2020). WHO Director-General\'s opening remarks at the media briefing on COVID-19. Geneva: WHO.'),
        numbered('Ritchie, H., et al. (2020). Coronavirus Pandemic (COVID-19). Our World in Data. https://ourworldindata.org/coronavirus'),

      ]
    }
  ]
});

// ── Write file ────────────────────────────────────────────────────────────────
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(OUT, buffer);
  console.log('Report generated:', OUT);
  console.log('File size:', Math.round(buffer.length / 1024), 'KB');
}).catch(err => {
  console.error('Error generating report:', err);
  process.exit(1);
});
