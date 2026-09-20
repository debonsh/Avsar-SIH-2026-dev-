// Ayush news feed: RSS → structured news for ticker + home strip.
// Usage: node scripts/ayush-news.test.mjs
// Tests the parser and gate logic without network.
import { parseNewsRss } from "./ayush-news.mjs";
import { AYUSH_NEWS, AYUSH_NEWS_AT } from "../app/src/ayush/news.js";

function testParseNewsRss() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0"><channel><title>Test</title>
  <item><title>Ministry of Ayush launches new BAMS internship scheme</title>
  <link>https://ayush.gov.in/1</link><pubDate>Mon, 01 Jan 2026 00:00:00 GMT</pubDate></item>
  <item><title>Unrelated tech news</title>
  <link>https://example.com/2</link><pubDate>Mon, 01 Jan 2026 00:00:00 GMT</pubDate></item>
  <item><title>CCRAS announces ayurveda research fellowship</title>
  <link>https://ccras.nic.in/3</link><pubDate>Mon, 01 Jan 2026 00:00:00 GMT</pubDate></item>
  <item><title>NCISM updates yoga therapy guidelines</title>
  <link>https://ncismindia.org/4</link><pubDate>Mon, 01 Jan 2026 00:00:00 GMT</pubDate></item>
  </channel></rss>`;
  const items = parseNewsRss(xml);
  if (items.length !== 3) throw new Error(`expected 3 items, got ${items.length}`);
  if (!items[0].title.includes("BAMS")) throw new Error("first item should be ayush-related");
  const titles = items.map((i) => i.title).join("|");
  if (titles.includes("Unrelated tech")) throw new Error("non-ayush item should be filtered");
  console.log("✔ parseNewsRss filters to ayush items only");
}

function testNewsShape() {
  if (!Array.isArray(AYUSH_NEWS)) throw new Error("AYUSH_NEWS should be an array");
  if (AYUSH_NEWS.length === 0) throw new Error("AYUSH_NEWS should not be empty (sample data)");
  const n = AYUSH_NEWS[0];
  if (!n.id || !n.title || !n.url) throw new Error("news item missing required fields");
  console.log("✔ AYUSH_NEWS has valid shape");
}

function testNewsDate() {
  if (typeof AYUSH_NEWS_AT !== "string") throw new Error("AYUSH_NEWS_AT should be a string");
  console.log("✔ AYUSH_NEWS_AT is a string");
}

testParseNewsRss();
testNewsShape();
testNewsDate();
console.log("\nall news feed tests pass");