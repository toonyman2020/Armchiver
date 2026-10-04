const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Add state
const stateStr = `  const [countingMode, setCountingMode] = useState<"multiple" | "single">(
    () =>
      (safeGetStorage("countingMode") as "multiple" | "single") || "multiple",
  );
  const [imageSplitMode, setImageSplitMode] = useState<"crop" | "highlight">(
    () =>
      (safeGetStorage("imageSplitMode") as "crop" | "highlight") || "highlight",
  );`;
content = content.replace(/  const \[countingMode, setCountingMode\] = useState<"multiple" \| "single">\(\n    \(\) =>\n      \(safeGetStorage\("countingMode"\) as "multiple" \| "single"\) \|\| "multiple",\n  \);/g, stateStr);

// Add useEffect
const effectStr = `  useEffect(() => {
    safeSetStorage("countingMode", countingMode);
  }, [countingMode]);

  useEffect(() => {
    safeSetStorage("imageSplitMode", imageSplitMode);
  }, [imageSplitMode]);`;
content = content.replace(/  useEffect\(\(\) => {\n    safeSetStorage\("countingMode", countingMode\);\n  }, \[countingMode\]\);/g, effectStr);

// Add to formData in upload
content = content.replace(/formData\.append\("countingMode", countingMode\);/g, `formData.append("countingMode", countingMode);\n      formData.append("imageSplitMode", imageSplitMode);`);

fs.writeFileSync('src/App.tsx', content);
