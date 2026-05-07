from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    print("Navigating to landing page...")
    page.goto("http://localhost:3000")
    page.wait_for_timeout(2000)
    page.screenshot(path="./verification/screenshots/landing.png")

    # We can't easily login, but we can verify the pages are served
    print("Attempting to access Admin Dashboard (expect redirect to home or login if not auth)...")
    page.goto("http://localhost:3000/admin")
    page.wait_for_timeout(2000)
    page.screenshot(path="./verification/screenshots/admin_dashboard_redirect.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="./verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
