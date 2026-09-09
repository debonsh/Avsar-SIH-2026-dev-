// roadmap generator: converts missing skills into week-by-week task plan
// Reuses coursesFor() URLs, no new external sources
import { coursesFor } from "../data/courses";

const WEEK_TEMPLATES = [
  "Complete course + take 1 screenshot proof",
  "Build mini-project, push to GitHub",
  "Add skill to resume with 1 quantified number",
];

export function roadmapGenerator(missingSkills = []) {
  if (!missingSkills.length) return [];

  const weeks = [];
  let weekNum = 1;

  // chunk missing skills into groups of 3 per week
  for (let i = 0; i < missingSkills.length; i += 3) {
    const chunk = missingSkills.slice(i, i + 3);
    const tasks = chunk.map((skill, idx) => {
      const courses = coursesFor(skill);
      const link = courses[0] || null;
      return {
        text: `${skill}: ${WEEK_TEMPLATES[idx] || WEEK_TEMPLATES[0]}`,
        skill,
        link,
      };
    });

    weeks.push({ week: weekNum, tasks });
    weekNum++;
  }

  return weeks;
}
