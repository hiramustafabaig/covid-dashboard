"""Capture dashboard screenshots for the project report."""
import time, os
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

opts = Options()
opts.add_argument('--headless')
opts.add_argument('--no-sandbox')
opts.add_argument('--disable-dev-shm-usage')
opts.add_argument('--window-size=1400,900')
opts.add_argument('--hide-scrollbars')

driver = webdriver.Chrome(options=opts)
driver.get('http://localhost:8082')
time.sleep(4)  # wait for D3 charts to render

out = 'E:/covid-dashboard/screenshots'
os.makedirs(out, exist_ok=True)

def scroll_and_snap(scroll_y, filename, extra_wait=0.5):
    driver.execute_script(f"window.scrollTo(0, {scroll_y})")
    time.sleep(extra_wait)
    driver.save_screenshot(f"{out}/{filename}")
    print(f"Saved {filename}")

# 1. Hero section
scroll_and_snap(0, "01_hero.png")

# 2. Stats / KPI cards
scroll_and_snap(820, "02_stats_controls.png")

# 3. World map
scroll_and_snap(1550, "03_world_map.png", 1)

# 4. Bar chart + Pie chart side by side
scroll_and_snap(2500, "04_bar_pie.png")

# 5. Bar chart closer
scroll_and_snap(2350, "05_bar_chart.png")

# 6. Pie chart closer
scroll_and_snap(2900, "06_pie_chart.png")

# 7. Line chart (scroll further)
scroll_and_snap(3700, "07_line_chart.png", 1)

# 8. Bubble chart
scroll_and_snap(4750, "08_bubble_chart.png")

# 9. Horizontal bar (fatality rate)
scroll_and_snap(5600, "09_hbar_fatality.png")

# 10. Treemap
scroll_and_snap(6450, "10_treemap.png")

# 11. Case Outcome stacked bar
scroll_and_snap(7350, "11_outcome_chart.png")

# 12. Radar chart
scroll_and_snap(8200, "12_radar_chart.png", 1)

# 13. Key Discoveries / Insights
scroll_and_snap(9200, "13_insights.png")

# 14. Footer with credits
driver.execute_script("window.scrollTo(0, document.body.scrollHeight)")
time.sleep(0.5)
driver.save_screenshot(f"{out}/14_footer.png")
print("Saved 14_footer.png")

driver.quit()
print("\nAll screenshots captured!")
