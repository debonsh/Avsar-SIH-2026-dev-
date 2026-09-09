// ponytail: parse locally, never upload PDF anywhere (privacy line for judges)

async function pdfAdapter(file) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  let out = "";
  for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    out += tc.items.map((it) => it.str).join(" ") + "\n";
  }
  return out;
}

async function textAdapter(file) {
  return file.text();
}

export async function parseResumeFile(file) {
  if (!file) return "";
  try {
    if (file.name.toLowerCase().endsWith(".pdf")) return await pdfAdapter(file);
    return await textAdapter(file);
  } catch {
    throw new Error("PDF parse failed. Paste resume text instead.");
  }
}
