from playwright.sync_api import sync_playwright

def verify_seo_optimization():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to a job detail page (we'll need to know a valid ID, or rely on mock data if the dev server uses it)
        # Since we don't know a valid ID without DB access, we might hit 404.
        # However, the dev environment might have seed data.
        # Let's try to navigate to the jobs listing first to find a link, then click it.

        try:
            print("Navigating to home...")
            page.goto("http://localhost:3000/en")
            page.wait_for_timeout(3000) # Wait for hydration

            # Check for semantic header
            header = page.locator("header")
            if header.count() > 0:
                print("Found semantic <header> tag.")
            else:
                print("ERROR: Semantic <header> tag not found.")

            # Navigate to jobs page
            print("Navigating to jobs list...")
            page.goto("http://localhost:3000/en/jobs")
            page.wait_for_timeout(3000)

            # Find a job card and click it
            first_job = page.locator("a[href*='/jobs/']").first
            if first_job.count() > 0:
                print("Found job link, clicking...")
                first_job.click()
                page.wait_for_timeout(3000)

                # Check for semantic article
                article = page.locator("article")
                if article.count() > 0:
                    print("Found semantic <article> tag on job detail.")
                else:
                    print("ERROR: Semantic <article> tag not found.")

                # Check for semantic aside
                aside = page.locator("aside")
                if aside.count() > 0:
                    print("Found semantic <aside> tag.")
                else:
                    print("ERROR: Semantic <aside> tag not found.")

                # Check for h1 title
                h1 = page.locator("h1")
                if h1.count() > 0:
                    print(f"Found H1: {h1.text_content()}")
                else:
                    print("ERROR: H1 not found.")

                # Take screenshot of Job Detail
                page.screenshot(path="frontend/verification/job_detail_seo.png")
                print("Screenshot saved to frontend/verification/job_detail_seo.png")

                # Verify Image Priority (optimized loading)
                # We can check if the main image has loading="eager" (which next/image with priority does)
                # Next.js images with priority usually have fetchpriority="high" or decoding="async" and NOT loading="lazy"
                main_image = page.locator("article img").first
                loading_attr = main_image.get_attribute("loading")
                print(f"Main image loading attribute: {loading_attr}")
                # Note: next/image might remove loading="lazy" for priority images, or set it to eager.

            else:
                print("No job links found. Taking screenshot of list.")
                page.screenshot(path="frontend/verification/job_list_fallback.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="frontend/verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_seo_optimization()
