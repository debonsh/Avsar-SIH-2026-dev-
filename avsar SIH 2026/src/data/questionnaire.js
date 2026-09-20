// ponytail: static banks are the rubric base — offline, instant, testable.
// AI customs (gemini.generateQuestions) layer on top; bank answers + AI answers
// compile to the same evidence shape for the ATS engine.
// Schema: { id, text, type: choice|yesno|text|url, options?, showIf: {id,value}? }
import { AYUSH_QUESTIONNAIRE } from "../ayush/seed.js";

export const QUESTIONNAIRE = {
  ayush: [
    ...AYUSH_QUESTIONNAIRE,
    { id: "logbook", text: "Do you maintain a case logbook or e-logbook?", type: "yesno" },
    { id: "logbook-count", text: "Roughly how many cases logged so far?", type: "text", showIf: { id: "logbook", value: "yes" } },
    { id: "posting", text: "Have your postings appeared anywhere public (college site, retreat page)?", type: "yesno" },
    { id: "posting-url", text: "Paste the posting link", type: "url", showIf: { id: "posting", value: "yes" } },
  ],
};
