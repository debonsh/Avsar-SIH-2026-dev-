# How to Make a PPT for Smart India Hackathon — video analysis

**Source:** https://www.youtube.com/watch?v=WMgLFxewZ1Y
**Title:** 🚀 How to Make PPT for Smart India Hackathon 2025 | Avoid these mistakes 🚫 | SIH Winner 🏆 | SIH2025
**Channel:** Mayank Yadav (SIH winner, team Saarthi) · 21:16 · 243K views
**Fetched:** auto-captions (Hindi source, English translation). YouTube rate-limited the caption host on this machine; the signed track URL was pulled from `yt-dlp -J` and downloaded directly.

---

## The central idea: three ways your PPT gets read

The video's whole argument is that a SIH idea deck is read three different ways, and the same deck has to survive all three. Every rule below traces back to one of them.

| Case | What happens | What the deck needs |
|---|---|---|
| **1 — Detailed review** | An evaluator reads every line, line by line | Bullets that each mean something on their own. No paragraphs. No filler. |
| **2 — Quick glance** | Someone gives it 5-6 seconds | Diagrams, logos, numbers, a comparison table. The shape must read at a glance. |
| **3 — ATS / computer scan** | Software keyword-matches the file | The words must exist as machine-readable text, not only inside images. |

> "It is very important to have a diagram on the second page and that should be your main diagram."

---

## Slide-by-slide

### Slide 1 — Title page
Basic metadata only. "Fill up everything as per your requirement." Nothing else goes here.

### Slide 2 — Proposed solution + THE architecture diagram
This is the highest-leverage slide in the deck.

- **Left:** proposed solution as bullet points of the main features. Bold the important words. List secondary features plainly. Adapt the feature list to your own PS.
- **Right: the system architecture diagram.** This is what creates the first impression. It was their main diagram both years.
- Never write paragraphs. "Every line should speak itself."
- The diagram should answer, in one image: what the technical aspects are, how many users there are, how many features there are, whether third-party libraries are used, which APIs are used, which features are user-specific vs general.
- Their diagram encoded access levels with two lock colours (blue = full access, orange = partial access) so a reader could see role permissions without reading text.
- This diagram alone also carries Case 2.

### Slide 3 — Technical approach
- Write the tech text, then add **a second diagram**. Any kind works — activity, sequence, user journey. Theirs was an alumni journey/roadmap. Recommendation: keep a diagram on this page too, and use it as a prop while presenting.
- List current, trending technology: frontend framework, backend, database, APIs, deployment target.
- **Technology logos matter more than the text above them** — in Case 2 nobody reads the text, they see the logos and conclude you covered everything.

### Slide 4 — Feasibility and viability
- The single most important thing on this page is **business potential**. Even if you don't intend to commercialise, you must show you thought about how it launches.
- Business models are not one-size-fits-all: subscription, outright sale, white labelling. Pick at least one you can explain end to end — cost, investment, and how revenue is generated.
- Their format: for each business model, a proper breakdown of what it costs and at what price it goes to the institute.
- **Supporting facts are mandatory.** It is not feasible just by asserting it. They listed research papers and data, and put the links on the references slide.
- Recommended addition: a **proof link under each point** as an anchor-tag blue line explaining why the claim is feasible.
- Pricing page mock (free tier / pro tier) is a good visual. Add a diagram if one comes to mind.

### Slide 5 — Impact and benefits
- Give a **360° overview** of every social and economic aspect the project benefits.
- **Use stats** — show as many real numbers as possible.
- Many problem statements state the potential impact in their own description. Quote that directly; it is the safest possible number.
- Keep a diagram here too, even a supporting one.

### Slide 6 — Research and references
- **The most important content on this slide is the comparison with existing systems.**
- They created accounts on 15-20 alumni platforms, listed advantages and disadvantages for each, and referenced the top three (the ones most IITs use). The good features became must-haves; the gaps became differentiators.
- **This is where juries attack.** "The other portal also provides this feature." If you go blank here, the round is over. Know the popular existing systems and their feature sets well enough to answer instantly.
- Put links to the research and the best practices, **and** the feasibility proof links referenced from slide 4.
- They also added a progress/status diagram showing the steps completed: understood PS → requirement analysis → studied existing vs proposed system → PPT prepared → working on prototype.

### The demo link
They included a link to a basic clickable prototype. Built with AI, deployed, link in the PPT. It did not have to be the real product — a basic front end showing the main features and a user flow was enough. Their reasoning: it beats a Figma file because you are showing something that runs, and it makes the jury believe you can code. **Always include a demo link.**

---

## Mistakes and fixes

| Mistake | Fix |
|---|---|
| Long paragraphs | Simple bullet points. Each line carries its own meaning. |
| Changing the official template's colours or fonts | Use the official template as given. Getting disqualified over a design tweak is not worth it. |
| No diagram on slide 2 | The architecture diagram is the first impression. It is the one non-optional visual. |
| Burying features in prose | Bold the important words; the bold text is what a skimmer actually reads. |
| Asserting feasibility | Attach facts and links as proof. |
| Ignoring existing systems | Study them, tabulate them, be able to answer questions about them. |
| Tech not visible at a glance | Add technology logos. |
| Keywords present only inside images | See below. |

## Case 3 in practice — making the file machine-readable
The sharpest practical tip in the video, and the one most teams miss:

- Feed the official PS description **and** your full PPT content to an AI and ask which keywords are missing, which are redundant, and what repeats. They credit this with a large improvement.
- **Add alt text or hidden text for anything that only exists as a picture.** Their own example: there was a JavaScript logo on a slide but the word "JavaScript" was never written, so a keyword scan would find nothing. Alt text on the image fixes it.
- Their diagram technique: **write the full text of the diagram line by line, then lay the diagram image on top of it.** The picture looks right for a human, and the words are still there for the scan.
- Any PDF editor can add the text layer.

---

## What this changes for our deck

Concretely, against the planned six slides:

1. **Slide 2 needs a real architecture diagram**, laid out as bullets on the left and the diagram on the right. Our plan had text only. The diagram must show the four roles, their access levels, the clients, the data layer, the AI layer, and the third-party services.
2. **Slide 3 needs technology logos** plus a second diagram (a user journey / pipeline flow).
3. **Slide 4 needs a business model** with a cost→revenue path, plus fact links. Our plan had risks and mitigations but no business case. The official template gives no sub-headings here, and the video says business potential is the headline.
4. **Slide 5 needs real stats**, and a supporting diagram.
5. **Slide 6 needs an existing-systems comparison table** and the **demo link**. Our plan had a reference list only.
6. **Every diagram and screenshot needs alt text, and the diagram text must exist as real text** in the file so an ATS scan can read it. The pptx builder must emit both.

All six added to the build plan.
