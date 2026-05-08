from playwright.sync_api import sync_playwright
import time
import os

def run_verification(page):
    # Go to landing page
    page.goto("http://localhost:3000")
    page.wait_for_timeout(2000)

    # We need a user to test deep links. Since we can't easily create one with RLS and hashing here,
    # we'll test the parseDeepLink utility logic by navigating to URLs manually and seeing if the pages handle them.

    # Test 1: Student Assignments page with ID
    # This should trigger the assignment modal if the ID existed.
    # Even if it doesn't exist, we can see the page attempting to load it.
    page.goto("http://localhost:3000/student/assignments?id=00000000-0000-0000-0000-000000000000")
    page.wait_for_timeout(2000)
    page.screenshot(path="/home/jules/verification/screenshots/student_assignments_deeplink.png")

    # Test 2: Student Courses page with lessonId
    page.goto("http://localhost:3000/student/courses?id=00000000-0000-0000-0000-000000000000&lessonId=11111111-1111-1111-1111-111111111111")
    page.wait_for_timeout(2000)
    page.screenshot(path="/home/jules/verification/screenshots/student_courses_deeplink.png")

    # Test 3: Teacher Grading page with ID
    page.goto("http://localhost:3000/teacher/grading?id=22222222-2222-2222-2222-222222222222")
    page.wait_for_timeout(2000)
    page.screenshot(path="/home/jules/verification/screenshots/teacher_grading_deeplink.png")

    # Hold final state for a moment
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_verification(page)
        finally:
            context.close()
            browser.close()
