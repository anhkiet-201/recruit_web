import assert from 'assert';
import { SeoHelper } from '../utils/SeoHelper'; // Adjust path if running with ts-node relative to root
import { SEO_CONSTANTS } from '../constants/SeoConstants';

// Mock the dependencies if needed, or rely on the actual logic since it's pure
console.log("Running SeoHelper tests...");

const testGenerateSeoMetadata = () => {
    // Test Case 1: Minimal Input
    const minimalDto = {
        title: "Test Job",
    };
    const result1 = SeoHelper.generateSeoMetadata(minimalDto);

    // Check Title format
    const expectedTitle = `Test Job${SEO_CONSTANTS.SEPARATOR}${SEO_CONSTANTS.DEFAULT_TITLE}`;
    assert.strictEqual(result1.title, expectedTitle, "Title should be formatted correctly");

    // Check default description
    assert.strictEqual(result1.description, SEO_CONSTANTS.DEFAULT_DESCRIPTION, "Should use default description");

    // Check default OG image
    // @ts-expect-error - access internal structure
    const ogImages = result1.openGraph?.images;
    assert.ok(Array.isArray(ogImages), "OG images should be an array");
    assert.strictEqual(ogImages[0].url, SEO_CONSTANTS.DEFAULT_OG_IMAGE, "Should use default OG image");


    // Test Case 2: Full Input
    const fullDto = {
        title: "Senior Engineer",
        description: "Great job opportunity",
        canonicalUrl: "https://example.com/job/1",
        ogImage: "https://example.com/image.jpg",
        keywords: ["tech", "job"],
        noIndex: true
    };
    const result2 = SeoHelper.generateSeoMetadata(fullDto);

    assert.strictEqual(result2.title, `Senior Engineer${SEO_CONSTANTS.SEPARATOR}${SEO_CONSTANTS.DEFAULT_TITLE}`, "Title matches");
    assert.strictEqual(result2.description, "Great job opportunity", "Description matches");

    // @ts-expect-error
    assert.strictEqual(result2.openGraph.images[0].url, "https://example.com/image.jpg", "Custom OG image matches");

    // @ts-expect-error
    assert.strictEqual(result2.alternates.canonical, "https://example.com/job/1", "Canonical URL matches");

    assert.deepStrictEqual(result2.keywords, ["tech", "job"], "Keywords match");

    // @ts-expect-error
    assert.strictEqual(result2.robots.index, false, "NoIndex applied");

    console.log("SeoHelper tests passed!");
};

try {
    testGenerateSeoMetadata();
} catch (error) {
    console.error("Test Failed:", error);
    process.exit(1);
}
