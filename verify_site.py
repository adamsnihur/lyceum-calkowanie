import asyncio
import os
from playwright.async_api import async_playwright

async def run_tests():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        console_errors = []
        page_errors = []

        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda err: page_errors.append(str(err)))

        target = "Lyceum/calkowanie/index.html" if os.path.exists("Lyceum/calkowanie/index.html") else "index.html"
        file_path = "file://" + os.path.abspath(target)
        print(f"Loading {file_path}...")
        await page.goto(file_path, wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2500)

        print("Console errors on load:", console_errors)
        print("Page errors on load:", page_errors)
        assert len(console_errors) == 0, f"Found console errors: {console_errors}"
        assert len(page_errors) == 0, f"Found page errors: {page_errors}"

        # KaTeX rendering verification
        katex_count = await page.locator(".katex").count()
        print(f"KaTeX rendered elements count: {katex_count}")
        assert katex_count > 10, f"KaTeX elements did not render properly! Count: {katex_count}"

        # Unrendered LaTeX Syntax Gate (brak surowych formuł $...\...$ w DOM)
        print("Running Unrendered LaTeX Syntax Gate...")
        unrendered_latex = await page.evaluate('''() => {
            const issues = [];
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: (node) => {
                        const parentTag = node.parentElement ? node.parentElement.tagName.toLowerCase() : '';
                        if (['script', 'style', 'pre', 'code'].includes(parentTag)) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        return NodeFilter.FILTER_ACCEPT;
                    }
                }
            );

            const latexRegex = /\\$[^$]+(?:\\[a-zA-Z]+|\\^|_)[^$]*\\$/;
            let node;
            while ((node = walker.nextNode())) {
                const text = node.textContent;
                if (latexRegex.test(text)) {
                    issues.push({
                        text: text.trim().substring(0, 100),
                        parent: node.parentElement ? node.parentElement.tagName + '.' + (node.parentElement.className || '') : 'unknown'
                    });
                }
            }
            return issues;
        }''')
        print(f"Unrendered LaTeX issues found: {len(unrendered_latex)}")
        assert len(unrendered_latex) == 0, f"Found unrendered LaTeX formulas in DOM: {unrendered_latex}"

        # 1. Test Module 1 Motion Loop Toggle
        print("Testing Module 1 Motion Loop...")
        btn_motion = page.locator("#btnToggleMotion")
        await btn_motion.click()
        await page.wait_for_timeout(400)
        btn_text = await btn_motion.inner_text()
        print(f"Module 1 Toggle State: {btn_text}")
        assert "Wznów" in btn_text
        await btn_motion.click()
        await page.wait_for_timeout(400)

        # 2. Test Module 2 Riemann Lab
        print("Testing Module 2 Riemann Lab...")
        slider_n = page.locator("#sliderRiemannN")
        await slider_n.fill("16")
        await page.wait_for_timeout(500)
        approx_val = await page.locator("#kpiRiemannApprox").inner_text()
        print(f"Module 2 Approx Value for N=16: {approx_val}")
        assert float(approx_val) > 0

        # Switch method to trapezoid
        btn_trap = page.locator(".riemann-method-btn[data-method='trapezoid']")
        await btn_trap.click()
        await page.wait_for_timeout(400)
        approx_trap = await page.locator("#kpiRiemannApprox").inner_text()
        print(f"Module 2 Trapezoid Approx: {approx_trap}")

        # 3. Test Module 3 Darboux Visualizer
        print("Testing Module 3 Darboux Visualizer...")
        slider_darboux = page.locator("#sliderDarbouxN")
        await slider_darboux.fill("12")
        await page.wait_for_timeout(400)
        gap_text = await page.locator("#lblDarbouxGap").inner_text()
        print(f"Module 3 Gap Text: {gap_text}")
        assert "Luka Darboux" in gap_text

        # 4. Test Module 5 Lebesgue Demonstrator
        print("Testing Module 5 Lebesgue Demonstrator...")
        btn_leb = page.locator("#btnModeLebesgue")
        await btn_leb.click()
        await page.wait_for_timeout(400)
        expl_text = await page.locator("#lebesgueExplText").inner_text()
        print(f"Module 5 Lebesgue Expl: {expl_text[:50]}...")
        assert "Lebesgue'a" in expl_text

        # 5. Test Module 7 Quiz
        print("Testing Module 7 Quiz...")
        opt_correct = page.locator("#q_0_opt_1")
        await opt_correct.scroll_into_view_if_needed()
        await opt_correct.click()
        await page.wait_for_timeout(400)
        score_val = await page.locator("#quizScoreText").inner_text()
        print(f"Module 7 Quiz Score after Q1: {score_val}")
        assert "1 / 5" in score_val

        # Quality Gate: SVG Text Clipping & DOM Overflow Check
        print("Running Quality Gate: SVG Text Clipping & DOM Overflow Check...")
        clipped_svg = await page.evaluate('''() => {
            const issues = [];
            document.querySelectorAll('svg').forEach(svg => {
                const vb = svg.viewBox.baseVal;
                if (!vb || vb.width === 0) return;
                svg.querySelectorAll('text, tspan').forEach(t => {
                    const text = t.textContent.trim();
                    if (!text) return;
                    try {
                        const bbox = t.getBBox();
                        if (bbox.x < vb.x - 2 || (bbox.x + bbox.width) > (vb.x + vb.width + 2)) {
                            issues.push({ text: text, x: bbox.x, width: bbox.width, vb_x: vb.x, vb_w: vb.width });
                        }
                    } catch (e) {}
                });
            });
            return issues;
        }''')
        print(f"SVG Text clipping issues found: {len(clipped_svg)}")
        assert len(clipped_svg) == 0, f"Found clipped SVG text elements: {clipped_svg}"

        # Multi-viewport responsive tests
        viewports = [
            ("Desktop 1440px", {"width": 1440, "height": 900}),
            ("Tablet 768px", {"width": 768, "height": 1024}),
            ("Mobile 375px", {"width": 375, "height": 812})
        ]
        for name, vp in viewports:
            await page.set_viewport_size(vp)
            await page.wait_for_timeout(300)
            has_h_scroll = await page.evaluate('''() => {
                return document.documentElement.scrollWidth > window.innerWidth + 2;
            }''')
            print(f"Viewport {name} -> Horizontal scroll detected: {has_h_scroll}")
            assert not has_h_scroll, f"Horizontal scroll detected on {name}!"

        # Reset viewport and capture screenshot
        await page.set_viewport_size({"width": 1440, "height": 900})
        ss_path = "Lyceum/calkowanie/screenshot_verified.png" if os.path.exists("Lyceum/calkowanie") else "screenshot_verified.png"
        await page.screenshot(path=ss_path, full_page=True)
        print(f"Saved {ss_path}")

        await browser.close()
        print("All tests passed with 0 errors!")

if __name__ == "__main__":
    asyncio.run(run_tests())
