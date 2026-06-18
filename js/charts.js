/**
 * DSC327 - COVID-19 Dashboard
 * D3.js Visualizations Module
 * Fixed version - all rendering bugs resolved
 */

// Color scales
const colorScale = d3.scaleSequentialLog()
    .domain([1000, 10000000])
    .interpolator(d3.interpolateViridis);

const fatalityColorScale = d3.scaleLinear()
    .domain([0, 0.03, 0.06, 0.10, 0.15])
    .range(['#10B981', '#34D399', '#F59E0B', '#F97316', '#EF4444']);

const regionColors = {
    'Asia': '#3B82F6',
    'Europe': '#8B5CF6',
    'North America': '#10B981',
    'South America': '#06B6D4',
    'Americas': '#10B981',
    'Africa': '#F59E0B',
    'Oceania': '#EC4899',
    'Other': '#94A3B8'
};

// ============================================
// Tooltip helper
// ============================================
function getTooltip() {
    let tooltip = d3.select('.tooltip');
    if (tooltip.empty()) {
        tooltip = d3.select('body').append('div').attr('class', 'tooltip');
    }
    return tooltip;
}

// ============================================
// 1. Choropleth Map Visualization
// ============================================

async function renderChoroplethMap(data, metric = 'confirmed') {
    const container = document.getElementById('choroplethMap');
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = 450;

    d3.select('#choroplethMap').selectAll('*').remove();

    const svg = d3.select('#choroplethMap')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('background', 'transparent');

    const projection = d3.geoMercator()
        .scale(width / 6.5)
        .translate([width / 2, height / 1.7]);

    const path = d3.geoPath().projection(projection);

    // Build a lookup map: numeric ID → data
    const dataByNumericId = new Map();
    // Also build by ISO2 and name for fallback
    const dataByCode = new Map();
    const dataByName = new Map();

    data.forEach(d => {
        if (d.country_code) dataByCode.set(d.country_code.toUpperCase(), d);
        if (d.country) dataByName.set(d.country.toLowerCase(), d);
    });

    // ISO numeric → ISO2 mapping (partial, most common)
    const numericToISO2 = {
        4:'AF',8:'AL',12:'DZ',20:'AD',24:'AO',32:'AR',36:'AU',40:'AT',50:'BD',56:'BE',
        64:'BT',68:'BO',76:'BR',100:'BG',116:'KH',120:'CM',124:'CA',144:'LK',152:'CL',
        156:'CN',170:'CO',178:'CG',180:'CD',188:'CR',191:'HR',192:'CU',196:'CY',203:'CZ',
        208:'DK',218:'EC',818:'EG',222:'SV',233:'EE',231:'ET',246:'FI',250:'FR',266:'GA',
        276:'DE',288:'GH',300:'GR',320:'GT',332:'HT',340:'HN',348:'HU',356:'IN',360:'ID',
        364:'IR',368:'IQ',372:'IE',376:'IL',380:'IT',384:'CI',388:'JM',392:'JP',400:'JO',
        398:'KZ',404:'KE',410:'KR',408:'KP',414:'KW',418:'LA',422:'LB',426:'LS',430:'LR',
        434:'LY',440:'LT',442:'LU',450:'MG',458:'MY',484:'MX',496:'MN',504:'MA',508:'MZ',
        516:'NA',524:'NP',528:'NL',554:'NZ',558:'NI',566:'NG',578:'NO',586:'PK',591:'PA',
        598:'PG',600:'PY',604:'PE',608:'PH',616:'PL',620:'PT',630:'PR',634:'QA',642:'RO',
        643:'RU',646:'RW',682:'SA',686:'SN',694:'SL',703:'SK',705:'SI',706:'SO',710:'ZA',
        724:'ES',729:'SD',752:'SE',756:'CH',760:'SY',762:'TJ',764:'TH',626:'TL',768:'TG',
        780:'TT',788:'TN',792:'TR',800:'UG',804:'UA',784:'AE',826:'GB',840:'US',858:'UY',
        860:'UZ',862:'VE',704:'VN',887:'YE',894:'ZM',716:'ZW',
    };

    try {
        const worldGeoJson = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json');
        const countries = topojson.feature(worldGeoJson, worldGeoJson.objects.countries);

        svg.selectAll('path')
            .data(countries.features)
            .enter()
            .append('path')
            .attr('class', 'country')
            .attr('d', path)
            .attr('fill', d => {
                const numericId = parseInt(d.id);
                const iso2 = numericToISO2[numericId];
                let countryData = iso2 ? dataByCode.get(iso2) : null;

                if (countryData) {
                    let value = countryData[metric] || 0;
                    if (metric === 'active') {
                        value = (countryData.confirmed || 0) - (countryData.recovered || 0) - (countryData.deaths || 0);
                    }
                    if (value > 0) return colorScale(Math.max(value, 1000));
                }
                return '#CBD5E1';
            })
            .attr('stroke', '#FFFFFF')
            .attr('stroke-width', 0.5)
            .on('mouseover', function(event, d) {
                const numericId = parseInt(d.id);
                const iso2 = numericToISO2[numericId];
                const countryData = iso2 ? dataByCode.get(iso2) : null;

                if (countryData) {
                    const active = (countryData.confirmed || 0) - (countryData.recovered || 0) - (countryData.deaths || 0);
                    getTooltip()
                        .style('opacity', 1)
                        .html(`
                            <strong>${countryData.country}</strong><br>
                            Confirmed: ${formatNumber(countryData.confirmed)}<br>
                            Deaths: ${formatNumber(countryData.deaths)}<br>
                            Recovered: ${formatNumber(countryData.recovered)}<br>
                            Active: ${formatNumber(active)}<br>
                            Fatality Rate: ${(countryData.deaths / countryData.confirmed * 100).toFixed(2)}%
                        `)
                        .style('left', (event.pageX + 14) + 'px')
                        .style('top', (event.pageY - 40) + 'px');
                    d3.select(this).attr('stroke-width', 2).attr('stroke', '#3B82F6');
                }
            })
            .on('mouseout', function() {
                getTooltip().style('opacity', 0);
                d3.select(this).attr('stroke-width', 0.5).attr('stroke', '#FFFFFF');
            });

        // Zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on('zoom', (event) => {
                svg.selectAll('path').attr('transform', event.transform);
            });

        svg.call(zoom);

        // Map control buttons (remove old listeners by cloning)
        const mapResetBtn = document.getElementById('mapResetBtn');
        const mapZoomInBtn = document.getElementById('mapZoomInBtn');
        const mapZoomOutBtn = document.getElementById('mapZoomOutBtn');

        if (mapResetBtn) {
            const newBtn = mapResetBtn.cloneNode(true);
            mapResetBtn.parentNode.replaceChild(newBtn, mapResetBtn);
            newBtn.addEventListener('click', () => svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity));
        }
        if (mapZoomInBtn) {
            const newBtn = mapZoomInBtn.cloneNode(true);
            mapZoomInBtn.parentNode.replaceChild(newBtn, mapZoomInBtn);
            newBtn.addEventListener('click', () => svg.transition().duration(750).call(zoom.scaleBy, 1.5));
        }
        if (mapZoomOutBtn) {
            const newBtn = mapZoomOutBtn.cloneNode(true);
            mapZoomOutBtn.parentNode.replaceChild(newBtn, mapZoomOutBtn);
            newBtn.addEventListener('click', () => svg.transition().duration(750).call(zoom.scaleBy, 0.75));
        }

        // Legend
        const legendWidth = 200, legendHeight = 12;
        const legendSvg = svg.append('g').attr('transform', `translate(20, ${height - 40})`);

        const defs = svg.append('defs');
        const linearGradient = defs.append('linearGradient').attr('id', 'map-legend-gradient');
        linearGradient.selectAll('stop')
            .data([
                { offset: '0%', color: d3.interpolateViridis(0) },
                { offset: '50%', color: d3.interpolateViridis(0.5) },
                { offset: '100%', color: d3.interpolateViridis(1) }
            ])
            .enter().append('stop')
            .attr('offset', d => d.offset)
            .attr('stop-color', d => d.color);

        legendSvg.append('rect')
            .attr('width', legendWidth).attr('height', legendHeight)
            .style('fill', 'url(#map-legend-gradient)').attr('rx', 4);

        legendSvg.append('text').attr('x', 0).attr('y', -4)
            .style('font-size', '9px').style('fill', '#64748B').text('Low');
        legendSvg.append('text').attr('x', legendWidth).attr('y', -4)
            .attr('text-anchor', 'end')
            .style('font-size', '9px').style('fill', '#64748B').text('High');

    } catch (error) {
        console.error('Map error:', error);
        showFallbackMap(svg, width, height, data, metric);
    }
}

function showFallbackMap(svg, width, height, data, metric) {
    svg.append('rect').attr('width', width).attr('height', height)
        .attr('fill', '#F1F5F9').attr('rx', 12);

    svg.append('text').attr('x', width / 2).attr('y', 30)
        .attr('text-anchor', 'middle').attr('fill', '#64748B')
        .style('font-size', '14px').style('font-weight', '600')
        .text('Top Countries by ' + metric.charAt(0).toUpperCase() + metric.slice(1));

    const topData = [...data].sort((a, b) => b[metric] - a[metric]).slice(0, 15);
    const radiusScale = d3.scaleSqrt()
        .domain([0, d3.max(topData, d => d[metric] || 0)])
        .range([8, 45]);

    topData.forEach((d, i) => {
        const col = i % 5;
        const row = Math.floor(i / 5);
        const x = 80 + col * ((width - 120) / 5);
        const y = 70 + row * 120;
        const r = radiusScale(d[metric] || 0);

        svg.append('circle')
            .attr('cx', x).attr('cy', y).attr('r', r)
            .attr('fill', colorScale(Math.max(d[metric] || 0, 1000)))
            .attr('opacity', 0.85).attr('stroke', '#fff').attr('stroke-width', 2)
            .style('cursor', 'pointer')
            .on('mouseover', function(event) {
                getTooltip().style('opacity', 1)
                    .html(`<strong>${d.country}</strong><br>${metric}: ${formatNumber(d[metric])}`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 30) + 'px');
                d3.select(this).attr('opacity', 1);
            })
            .on('mouseout', function() {
                getTooltip().style('opacity', 0);
                d3.select(this).attr('opacity', 0.85);
            });

        svg.append('text').attr('x', x).attr('y', y + r + 14)
            .attr('text-anchor', 'middle').attr('fill', '#475569')
            .style('font-size', '9px')
            .text(d.country.length > 10 ? d.country.substring(0, 9) + '…' : d.country);
    });
}

// ============================================
// 2. Bar Chart Visualization
// ============================================

function renderBarChart(data, metric = 'confirmed', topN = 10) {
    const container = document.getElementById('barChart');
    if (!container) return;

    const width = container.clientWidth || 500;
    const height = 420;
    const margin = { top: 20, right: 20, bottom: 110, left: 70 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    d3.select('#barChart').selectAll('*').remove();

    const filteredData = [...data]
        .filter(d => (d[metric] || 0) > 0)
        .sort((a, b) => (b[metric] || 0) - (a[metric] || 0))
        .slice(0, topN);

    if (!filteredData.length) {
        d3.select('#barChart').append('div').attr('class', 'loading')
            .html('<p style="color:#64748B">No data for this metric/region</p>');
        return;
    }

    const svg = d3.select('#barChart')
        .append('svg').attr('width', width).attr('height', height)
        .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand()
        .domain(filteredData.map(d => d.country))
        .range([0, innerWidth]).padding(0.3);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d[metric] || 0)])
        .range([innerHeight, 0]).nice();

    const barColorScale = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d[metric] || 0)])
        .range(['#93C5FD', '#1D4ED8']);

    // Grid lines
    svg.append('g').attr('class', 'grid')
        .call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(''))
        .selectAll('line').attr('stroke', 'rgba(148,163,184,0.2)');
    svg.select('.grid .domain').remove();

    svg.append('g').attr('class', 'axis')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .attr('transform', 'rotate(-40)')
        .style('text-anchor', 'end')
        .style('font-size', '10px');

    svg.append('g').attr('class', 'axis')
        .call(d3.axisLeft(yScale).tickFormat(d => formatNumberShort(d)));

    const bars = svg.selectAll('rect.bar')
        .data(filteredData).enter()
        .append('rect').attr('class', 'bar')
        .attr('x', d => xScale(d.country))
        .attr('width', xScale.bandwidth())
        .attr('y', innerHeight).attr('height', 0)
        .attr('fill', d => barColorScale(d[metric] || 0))
        .attr('rx', 6)
        .on('mouseover', function(event, d) {
            getTooltip().style('opacity', 1)
                .html(`<strong>${d.country}</strong><br>${metric.charAt(0).toUpperCase() + metric.slice(1)}: ${formatNumber(d[metric])}<br>Deaths: ${formatNumber(d.deaths)}<br>Fatality Rate: ${((d.deaths / d.confirmed) * 100).toFixed(2)}%`)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 30) + 'px');
            d3.select(this).attr('opacity', 0.8);
        })
        .on('mouseout', function() {
            getTooltip().style('opacity', 0);
            d3.select(this).attr('opacity', 1);
        });

    bars.transition().duration(isAnimating ? 800 : 0)
        .attr('y', d => yScale(d[metric] || 0))
        .attr('height', d => innerHeight - yScale(d[metric] || 0));

    // Sort button handler
    let sortAsc = false;
    const sortBtn = document.getElementById('sortBarBtn');
    if (sortBtn) {
        const newSortBtn = sortBtn.cloneNode(true);
        sortBtn.parentNode.replaceChild(newSortBtn, sortBtn);
        newSortBtn.addEventListener('click', () => {
            sortAsc = !sortAsc;
            const resorted = sortAsc
                ? [...filteredData].sort((a, b) => (a[metric] || 0) - (b[metric] || 0))
                : [...filteredData].sort((a, b) => (b[metric] || 0) - (a[metric] || 0));

            xScale.domain(resorted.map(d => d.country));
            svg.select('.axis').call(d3.axisBottom(xScale))
                .selectAll('text').attr('transform', 'rotate(-40)').style('text-anchor', 'end').style('font-size', '10px');

            svg.selectAll('rect.bar').data(resorted)
                .transition().duration(600)
                .attr('x', d => xScale(d.country));
        });
    }
}

// ============================================
// 3. Pie / Donut Chart Visualization
// ============================================

function renderPieChart(data) {
    const container = document.getElementById('pieChart');
    if (!container) return;

    const width = container.clientWidth || 500;
    const height = 420;
    const radius = Math.min(width * 0.45, height * 0.45);

    d3.select('#pieChart').selectAll('*').remove();

    const regionData = {};
    data.forEach(d => {
        const continent = d.continent || 'Other';
        regionData[continent] = (regionData[continent] || 0) + (d.confirmed || 0);
    });

    const pieData = Object.entries(regionData)
        .filter(([, v]) => v > 0)
        .map(([region, value]) => ({ region, value }))
        .sort((a, b) => b.value - a.value);

    if (!pieData.length) return;

    const svg = d3.select('#pieChart').append('svg')
        .attr('width', width).attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2.6}, ${height / 2})`);

    const pie = d3.pie().value(d => d.value).sort(null);

    const arc = d3.arc().innerRadius(radius * 0.45).outerRadius(radius);
    const arcHover = d3.arc().innerRadius(radius * 0.45).outerRadius(radius + 12);

    const color = d3.scaleOrdinal()
        .domain(Object.keys(regionColors))
        .range(Object.values(regionColors));

    const total = d3.sum(pieData, d => d.value);

    svg.selectAll('path')
        .data(pie(pieData)).enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', d => color(d.data.region))
        .attr('stroke', 'white').attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).transition().duration(150).attr('d', arcHover);
            getTooltip().style('opacity', 1)
                .html(`<strong>${d.data.region}</strong><br>Cases: ${formatNumber(d.data.value)}<br>Share: ${((d.data.value / total) * 100).toFixed(1)}%`)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 30) + 'px');
        })
        .on('mouseout', function() {
            d3.select(this).transition().duration(150).attr('d', arc);
            getTooltip().style('opacity', 0);
        });

    // Center label
    svg.append('text').attr('text-anchor', 'middle').attr('y', -8)
        .style('font-size', '11px').style('fill', '#64748B').text('Global');
    svg.append('text').attr('text-anchor', 'middle').attr('y', 10)
        .style('font-size', '13px').style('font-weight', '700').style('fill', '#0F172A')
        .text(formatNumberShort(total));

    // Legend
    const legend = svg.append('g').attr('transform', `translate(${radius + 20}, ${-radius * 0.8})`);
    pieData.forEach((d, i) => {
        legend.append('rect').attr('x', 0).attr('y', i * 26)
            .attr('width', 12).attr('height', 12)
            .attr('fill', color(d.region)).attr('rx', 3);
        legend.append('text').attr('x', 18).attr('y', i * 26 + 10)
            .style('font-size', '10px').style('fill', '#475569')
            .text(`${d.region} (${((d.value / total) * 100).toFixed(1)}%)`);
    });
}

// ============================================
// 4. Time Series Line Chart
// ============================================

function renderLineChart(data, timeRange = 'all') {
    const container = document.getElementById('lineChart');
    if (!container || !data || !data.length) return;

    const width = container.clientWidth || 800;
    const height = 420;
    const margin = { top: 20, right: 90, bottom: 50, left: 75 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    d3.select('#lineChart').selectAll('*').remove();

    // Filter by time range
    let filteredData = [...data];
    const now = new Date();
    if (timeRange === '30d') {
        const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 30);
        filteredData = data.filter(d => new Date(d.date) >= cutoff);
    } else if (timeRange === '90d') {
        const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 90);
        filteredData = data.filter(d => new Date(d.date) >= cutoff);
    } else if (timeRange === '1y') {
        const cutoff = new Date(now); cutoff.setFullYear(cutoff.getFullYear() - 1);
        filteredData = data.filter(d => new Date(d.date) >= cutoff);
    }

    if (!filteredData.length) return;

    const svg = d3.select('#lineChart').append('svg')
        .attr('width', width).attr('height', height)
        .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleTime()
        .domain(d3.extent(filteredData, d => new Date(d.date)))
        .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => Math.max(d.cases || 0, d.deaths || 0, d.recovered || 0))])
        .range([innerHeight, 0]).nice();

    // Grid
    svg.append('g').attr('class', 'grid')
        .call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(''))
        .selectAll('line').attr('stroke', 'rgba(148,163,184,0.15)');
    svg.select('.grid .domain').remove();

    svg.append('g').attr('class', 'axis')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%b %Y')).ticks(6));

    svg.append('g').attr('class', 'axis')
        .call(d3.axisLeft(yScale).tickFormat(d => formatNumberShort(d)));

    const lineGen = (key) => d3.line()
        .defined(d => d[key] != null && d[key] >= 0)
        .x(d => xScale(new Date(d.date)))
        .y(d => yScale(d[key] || 0))
        .curve(d3.curveMonotoneX);

    // Area under cases
    const area = d3.area()
        .defined(d => d.cases != null)
        .x(d => xScale(new Date(d.date)))
        .y0(innerHeight).y1(d => yScale(d.cases || 0))
        .curve(d3.curveMonotoneX);

    svg.append('path').datum(filteredData)
        .attr('fill', 'rgba(59,130,246,0.07)').attr('d', area);

    const lines = [
        { key: 'cases', color: '#3B82F6', label: 'Cases' },
        { key: 'deaths', color: '#EF4444', label: 'Deaths' },
        { key: 'recovered', color: '#10B981', label: 'Recovered' }
    ];

    lines.forEach((line, li) => {
        const path = svg.append('path').datum(filteredData)
            .attr('fill', 'none')
            .attr('stroke', line.color)
            .attr('stroke-width', li === 0 ? 2.5 : 2)
            .attr('d', lineGen(line.key));

        if (isAnimating && li === 0) {
            const len = path.node().getTotalLength();
            path.attr('stroke-dasharray', `${len} ${len}`)
                .attr('stroke-dashoffset', len)
                .transition().duration(1500)
                .attr('stroke-dashoffset', 0);
        }
    });

    // Crosshair + hover
    const focus = svg.append('g').style('display', 'none');
    focus.append('circle').attr('r', 5).attr('fill', '#3B82F6').attr('stroke', '#fff').attr('stroke-width', 2);
    focus.append('line').attr('class', 'focus-line-x')
        .attr('y1', 0).attr('y2', innerHeight)
        .attr('stroke', '#94A3B8').attr('stroke-width', 1).attr('stroke-dasharray', '4,4');

    svg.append('rect')
        .attr('width', innerWidth).attr('height', innerHeight)
        .attr('fill', 'none').attr('pointer-events', 'all')
        .on('mouseover', () => focus.style('display', null))
        .on('mouseout', () => { focus.style('display', 'none'); getTooltip().style('opacity', 0); })
        .on('mousemove', function(event) {
            const mouseX = d3.pointer(event)[0];
            const x0 = xScale.invert(mouseX);
            const bisect = d3.bisector(d => new Date(d.date)).left;
            const index = Math.min(bisect(filteredData, x0, 1), filteredData.length - 1);
            const d0 = filteredData[index - 1];
            const d1 = filteredData[index];
            const d = (d1 && Math.abs(x0 - new Date(d0?.date)) > Math.abs(x0 - new Date(d1.date))) ? d1 : (d0 || d1);

            if (!d) return;
            const cx = xScale(new Date(d.date));
            const cy = yScale(d.cases || 0);
            focus.attr('transform', `translate(${cx},${cy})`);
            focus.select('.focus-line-x').attr('y2', innerHeight - cy);

            getTooltip().style('opacity', 1)
                .html(`<strong>${new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong><br>Cases: ${formatNumber(d.cases)}<br>Deaths: ${formatNumber(d.deaths)}<br>Recovered: ${formatNumber(d.recovered)}`)
                .style('left', (event.pageX + 14) + 'px')
                .style('top', (event.pageY - 50) + 'px');
        });

    // Legend
    const legend = svg.append('g').attr('transform', `translate(${innerWidth + 10}, 10)`);
    lines.forEach((l, i) => {
        legend.append('rect').attr('width', 12).attr('height', 12).attr('y', i * 22)
            .attr('fill', l.color).attr('rx', 2);
        legend.append('text').attr('x', 18).attr('y', i * 22 + 10)
            .style('font-size', '10px').style('fill', '#475569').text(l.label);
    });
}

// ============================================
// 5. Bubble Chart Visualization
// ============================================

function renderBubbleChart(data, metric = 'confirmed') {
    const container = document.getElementById('bubbleChart');
    if (!container) return;

    const width = container.clientWidth || 500;
    const height = 420;
    const margin = { top: 20, right: 20, bottom: 55, left: 65 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    d3.select('#bubbleChart').selectAll('*').remove();

    const filteredData = data.filter(d => d.confirmed > 50000 && d.deaths > 0);

    if (!filteredData.length) return;

    const svg = d3.select('#bubbleChart').append('svg')
        .attr('width', width).attr('height', height)
        .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLog()
        .domain([50000, d3.max(filteredData, d => d.confirmed)])
        .range([0, innerWidth]).nice();

    const yScale = d3.scaleLinear()
        .domain([0, 0.15])
        .range([innerHeight, 0]).nice();

    const radiusScale = d3.scaleSqrt()
        .domain([0, d3.max(filteredData, d => d[metric] || 0)])
        .range([4, 40]);

    // Grid
    svg.append('g').attr('class', 'grid')
        .call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(''))
        .selectAll('line').attr('stroke', 'rgba(148,163,184,0.15)');
    svg.select('.grid .domain').remove();

    svg.append('g').attr('class', 'axis')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format('~s')));

    svg.append('g').attr('class', 'axis')
        .call(d3.axisLeft(yScale).tickFormat(d => `${(d * 100).toFixed(0)}%`));

    svg.append('text').attr('x', innerWidth / 2).attr('y', innerHeight + 45)
        .attr('text-anchor', 'middle').style('font-size', '11px').style('fill', '#64748B')
        .text('Total Confirmed Cases (log scale)');

    svg.append('text').attr('transform', 'rotate(-90)')
        .attr('x', -innerHeight / 2).attr('y', -50)
        .attr('text-anchor', 'middle').style('font-size', '11px').style('fill', '#64748B')
        .text('Fatality Rate (%)');

    const groups = svg.selectAll('g.bubble-g')
        .data(filteredData).enter()
        .append('g').attr('class', 'bubble-g')
        .attr('transform', d => {
            const x = xScale(d.confirmed);
            const fr = d.deaths / d.confirmed;
            const y = yScale(Math.min(fr, 0.15));
            return `translate(${x},${y})`;
        });

    groups.append('circle').attr('class', 'bubble')
        .attr('r', d => radiusScale(d[metric] || 0))
        .attr('fill', d => fatalityColorScale(d.deaths / d.confirmed))
        .attr('opacity', 0.72).attr('stroke', '#fff').attr('stroke-width', 1.5)
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 1);
            getTooltip().style('opacity', 1)
                .html(`<strong>${d.country}</strong><br>Confirmed: ${formatNumber(d.confirmed)}<br>Deaths: ${formatNumber(d.deaths)}<br>Fatality Rate: ${(d.deaths / d.confirmed * 100).toFixed(2)}%`)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 30) + 'px');
        })
        .on('mouseout', function() {
            d3.select(this).attr('opacity', 0.72);
            getTooltip().style('opacity', 0);
        });

    groups.filter(d => radiusScale(d[metric] || 0) > 14)
        .append('text').attr('text-anchor', 'middle')
        .attr('dy', d => -radiusScale(d[metric] || 0) - 4)
        .style('font-size', '9px').style('fill', '#1E293B').style('font-weight', '500')
        .text(d => d.country.length > 12 ? d.country.substring(0, 10) + '…' : d.country);

    // Reset button
    const resetBtn = document.getElementById('resetBubbleBtn');
    if (resetBtn) {
        const newBtn = resetBtn.cloneNode(true);
        resetBtn.parentNode.replaceChild(newBtn, resetBtn);
        newBtn.addEventListener('click', () => renderBubbleChart(data, metric));
    }
}

// ============================================
// 6. Horizontal Bar Chart (Fatality Rate)
// ============================================

function renderHorizontalBarChart(data) {
    const container = document.getElementById('horizontalBarChart');
    if (!container) return;

    const width = container.clientWidth || 500;
    const height = 420;
    const margin = { top: 20, right: 60, bottom: 20, left: 110 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    d3.select('#horizontalBarChart').selectAll('*').remove();

    const filteredData = [...data]
        .filter(d => d.confirmed > 10000 && d.deaths > 0)
        .map(d => ({ ...d, fatalityRate: (d.deaths / d.confirmed * 100) }))
        .sort((a, b) => b.fatalityRate - a.fatalityRate)
        .slice(0, 15);

    if (!filteredData.length) return;

    const svg = d3.select('#horizontalBarChart').append('svg')
        .attr('width', width).attr('height', height)
        .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const yScale = d3.scaleBand()
        .domain(filteredData.map(d => d.country))
        .range([0, innerHeight]).padding(0.25);

    const xScale = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d.fatalityRate)])
        .range([0, innerWidth]).nice();

    svg.append('g').attr('class', 'axis').call(d3.axisLeft(yScale).tickSize(0))
        .select('.domain').remove();

    svg.append('g').attr('class', 'axis')
        .call(d3.axisTop(xScale).tickFormat(d => `${d.toFixed(1)}%`).ticks(5));

    const bars = svg.selectAll('rect.bar').data(filteredData).enter()
        .append('rect').attr('class', 'bar')
        .attr('y', d => yScale(d.country))
        .attr('height', yScale.bandwidth())
        .attr('x', 0).attr('width', 0)
        .attr('fill', d => fatalityColorScale(d.fatalityRate / 100))
        .attr('rx', 5)
        .on('mouseover', function(event, d) {
            getTooltip().style('opacity', 1)
                .html(`<strong>${d.country}</strong><br>Fatality Rate: ${d.fatalityRate.toFixed(2)}%<br>Deaths: ${formatNumber(d.deaths)}<br>Confirmed: ${formatNumber(d.confirmed)}`)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 30) + 'px');
            d3.select(this).attr('opacity', 0.8);
        })
        .on('mouseout', function() {
            getTooltip().style('opacity', 0);
            d3.select(this).attr('opacity', 1);
        });

    bars.transition().duration(isAnimating ? 800 : 0)
        .attr('width', d => xScale(d.fatalityRate));

    svg.selectAll('text.bar-label').data(filteredData).enter()
        .append('text').attr('class', 'bar-label')
        .attr('x', d => xScale(d.fatalityRate) + 5)
        .attr('y', d => yScale(d.country) + yScale.bandwidth() / 2)
        .attr('dy', '.35em')
        .style('font-size', '10px').style('fill', '#475569')
        .text(d => `${d.fatalityRate.toFixed(1)}%`);
}

// ============================================
// 7. Treemap Chart
// ============================================

function renderTreemapChart(data) {
    const container = document.getElementById('treemapChart');
    if (!container) return;

    const width = container.clientWidth || 500;
    const height = 420;

    d3.select('#treemapChart').selectAll('*').remove();

    const groupedData = {};
    data.forEach(d => {
        if (d.continent && d.confirmed > 0) {
            if (!groupedData[d.continent]) groupedData[d.continent] = [];
            groupedData[d.continent].push(d);
        }
    });

    if (!Object.keys(groupedData).length) return;

    const rootData = {
        name: 'root',
        children: Object.entries(groupedData).map(([region, countries]) => ({
            name: region,
            children: countries.slice(0, 12).map(c => ({
                name: c.country,
                value: c.confirmed || 0,
                fatalityRate: c.confirmed > 0 ? (c.deaths / c.confirmed * 100) : 0
            }))
        }))
    };

    const root = d3.hierarchy(rootData)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);

    d3.treemap().size([width, height]).padding(2).round(true)(root);

    const svg = d3.select('#treemapChart').append('svg')
        .attr('width', width).attr('height', height);

    const color = d3.scaleOrdinal()
        .domain(Object.keys(regionColors))
        .range(Object.values(regionColors));

    const cells = svg.selectAll('g.cell')
        .data(root.leaves()).enter()
        .append('g').attr('class', 'cell')
        .attr('transform', d => `translate(${d.x0},${d.y0})`);

    cells.append('rect')
        .attr('width', d => Math.max(0, d.x1 - d.x0))
        .attr('height', d => Math.max(0, d.y1 - d.y0))
        .attr('fill', d => color(d.parent.data.name))
        .attr('stroke', 'white').attr('stroke-width', 2)
        .attr('rx', 4).attr('opacity', 0.88)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 0.65);
            getTooltip().style('opacity', 1)
                .html(`<strong>${d.data.name}</strong><br>Region: ${d.parent.data.name}<br>Cases: ${formatNumber(d.data.value)}<br>Fatality Rate: ${d.data.fatalityRate.toFixed(2)}%`)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 30) + 'px');
        })
        .on('mouseout', function() {
            d3.select(this).attr('opacity', 0.88);
            getTooltip().style('opacity', 0);
        });

    cells.filter(d => (d.x1 - d.x0) > 40 && (d.y1 - d.y0) > 20)
        .append('text').attr('x', 5).attr('y', 14)
        .attr('font-size', d => Math.min(11, Math.max(7, (d.x1 - d.x0) / 10)))
        .attr('fill', 'white').attr('font-weight', '600')
        .text(d => d.data.name.length > 14 ? d.data.name.substring(0, 12) + '…' : d.data.name);

    cells.filter(d => (d.x1 - d.x0) > 50 && (d.y1 - d.y0) > 35)
        .append('text').attr('x', 5).attr('y', 28)
        .attr('font-size', d => Math.min(9, Math.max(6, (d.x1 - d.x0) / 14)))
        .attr('fill', 'rgba(255,255,255,0.85)')
        .text(d => formatNumberShort(d.data.value));
}

// ============================================
// 8. Radar Chart for Country Comparison
// ============================================

function renderRadarChart(data, country1, country2) {
    const container = document.getElementById('radarChart');
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = 420;
    const radius = Math.min(width, height) / 2.8;

    d3.select('#radarChart').selectAll('*').remove();

    const c1 = data.find(d => d.country === country1);
    const c2 = data.find(d => d.country === country2);

    if (!c1 && !c2) {
        const placeholder = d3.select('#radarChart').append('div')
            .style('display', 'flex').style('flex-direction', 'column')
            .style('align-items', 'center').style('justify-content', 'center')
            .style('height', '100%').style('color', '#64748B').style('gap', '12px');
        placeholder.append('i').attr('class', 'fas fa-chart-line').style('font-size', '48px').style('opacity', '0.3');
        placeholder.append('p').text('Select countries from the dropdowns above to compare');
        return;
    }

    const metrics = [
        { name: 'Total Cases', key1: c1?.confirmed || 0, key2: c2?.confirmed || 0, max: d3.max(data, d => d.confirmed) },
        { name: 'Deaths', key1: c1?.deaths || 0, key2: c2?.deaths || 0, max: d3.max(data, d => d.deaths) },
        { name: 'Recovered', key1: c1?.recovered || 0, key2: c2?.recovered || 0, max: d3.max(data, d => d.recovered) },
        { name: 'Active', key1: Math.max(0, (c1?.confirmed || 0) - (c1?.deaths || 0) - (c1?.recovered || 0)), key2: Math.max(0, (c2?.confirmed || 0) - (c2?.deaths || 0) - (c2?.recovered || 0)), max: d3.max(data, d => Math.max(0, d.confirmed - d.deaths - d.recovered)) },
        { name: 'Fatality %', key1: c1 ? (c1.deaths / c1.confirmed) * 100 : 0, key2: c2 ? (c2.deaths / c2.confirmed) * 100 : 0, max: 15 },
        { name: 'Per Million', key1: c1 ? (c1.confirmed / c1.population * 1e6) : 0, key2: c2 ? (c2.confirmed / c2.population * 1e6) : 0, max: d3.max(data, d => d.confirmed / d.population * 1e6) }
    ];

    const N = metrics.length;
    const angleSlice = (Math.PI * 2) / N;

    const svg = d3.select('#radarChart').append('svg')
        .attr('width', width).attr('height', height)
        .append('g').attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Grid circles
    [0.2, 0.4, 0.6, 0.8, 1].forEach(level => {
        svg.append('circle').attr('r', radius * level)
            .attr('fill', 'none').attr('stroke', '#E2E8F0')
            .attr('stroke-width', 0.5).attr('stroke-dasharray', '3,3');
    });

    // Axes
    metrics.forEach((m, i) => {
        const angle = i * angleSlice;
        const x = radius * Math.cos(angle - Math.PI / 2);
        const y = radius * Math.sin(angle - Math.PI / 2);
        svg.append('line').attr('x1', 0).attr('y1', 0).attr('x2', x).attr('y2', y)
            .attr('stroke', '#E2E8F0').attr('stroke-width', 1);
        svg.append('text').attr('x', x * 1.18).attr('y', y * 1.18)
            .attr('text-anchor', 'middle').attr('dy', '0.35em')
            .style('font-size', '10px').style('fill', '#64748B').text(m.name);
    });

    const coords = (values) => metrics.map((m, i) => {
        const angle = i * angleSlice;
        const r = radius * Math.min(1, (values[i] / (m.max || 1)));
        return [r * Math.cos(angle - Math.PI / 2), r * Math.sin(angle - Math.PI / 2)];
    });

    const lineGen = d3.line().x(d => d[0]).y(d => d[1]).curve(d3.curveLinearClosed);

    if (c1) {
        const pts = coords(metrics.map(m => m.key1));
        svg.append('path').datum(pts).attr('d', lineGen)
            .attr('fill', 'rgba(59,130,246,0.25)').attr('stroke', '#3B82F6').attr('stroke-width', 2);
        pts.forEach(pt => svg.append('circle').attr('cx', pt[0]).attr('cy', pt[1])
            .attr('r', 4).attr('fill', '#3B82F6').attr('stroke', '#fff').attr('stroke-width', 1.5));
    }

    if (c2) {
        const pts = coords(metrics.map(m => m.key2));
        svg.append('path').datum(pts).attr('d', lineGen)
            .attr('fill', 'rgba(239,68,68,0.25)').attr('stroke', '#EF4444').attr('stroke-width', 2);
        pts.forEach(pt => svg.append('circle').attr('cx', pt[0]).attr('cy', pt[1])
            .attr('r', 4).attr('fill', '#EF4444').attr('stroke', '#fff').attr('stroke-width', 1.5));
    }

    // Legend
    const legend = svg.append('g').attr('transform', `translate(${radius + 15}, ${-radius})`);
    if (c1) {
        legend.append('rect').attr('width', 12).attr('height', 12).attr('fill', '#3B82F6').attr('rx', 3);
        legend.append('text').attr('x', 18).attr('y', 10).style('font-size', '11px').style('fill', '#475569').text(country1);
    }
    if (c2) {
        legend.append('rect').attr('width', 12).attr('height', 12).attr('y', 20).attr('fill', '#EF4444').attr('rx', 3);
        legend.append('text').attr('x', 18).attr('y', 30).style('font-size', '11px').style('fill', '#475569').text(country2);
    }
}

// ============================================
// Utility Functions
// ============================================

function formatNumber(num) {
    if (num == null || isNaN(num)) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return Math.floor(num).toLocaleString();
}

function formatNumberShort(num) {
    if (num == null || isNaN(num)) return '0';
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return Math.floor(num).toString();
}