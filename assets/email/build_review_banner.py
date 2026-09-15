"""Render review-500pt-banner.html to JPG (requires playwright)."""
from pathlib import Path

OUT = Path(__file__).resolve().parent / "review-500pt-banner.jpg"
HTML = Path(__file__).resolve().parent / "review-500pt-banner.html"


def main():
    from playwright.sync_api import sync_playwright

    url = HTML.as_uri()
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1200, "height": 675})
        page.goto(url, wait_until="networkidle")
        page.locator(".banner").screenshot(path=str(OUT), type="jpeg", quality=92)
        browser.close()
    print(OUT)


if __name__ == "__main__":
    main()
