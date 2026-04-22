from playwright.sync_api import sync_playwright
import os

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Create verification directories
        os.makedirs("verification/videos", exist_ok=True)
        os.makedirs("verification/screenshots", exist_ok=True)

        context = browser.new_context(
            record_video_dir="verification/videos"
        )
        page = context.new_page()

        try:
            # Landing page
            page.goto("http://localhost:3000")
            page.wait_for_timeout(5000)
            page.screenshot(path="verification/screenshots/landing.png")

            # Show Login
            page.click("text=Sign In")
            page.wait_for_timeout(2000)
            page.screenshot(path="verification/screenshots/login_modal.png")

        finally:
            context.close()
            browser.close()

if __name__ == "__main__":
    run_verification()
