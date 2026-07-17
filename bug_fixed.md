# QEdit Fixed Bugs Log

A log of all resolved bugs and layout improvements in the QEdit codebase.

## 1. Drag & Drop Reordering Robustness
* **Issue**: Dragging a question very quickly in the editor list caused it to disappear or corrupt the question sequence.
* **Root Cause**: The HTML5 drag event payload (`dataTransfer`) was processed before it completed setting state, causing indices to parse as `NaN`. JavaScript array `splice(NaN, 1)` default-targeted index `0` (deleting the first question), and out-of-bounds drop indexes added `undefined` items to the array.
* **Fix**: Added strict `isNaN()` and array boundaries checks to both the `li` drop targets and the parent `ul` container. Added `stopPropagation()` to list items.
* **Impacted Files**: [Editor.tsx](file:///c:/Users/Kishore/Desktop/Qedit/QEdit-main/components/Editor.tsx)

## 2. Modal Backdrop Click Drag-Release Fix
* **Issue**: Drag-selecting text inside the Question Form editor or Preview overlay and releasing the left-click outside the container caused the modal to close immediately, discarding all typing.
* **Root Cause**: The browser dispatches a `click` event on the backdrop (the nearest common ancestor) if a press happens inside and a release happens outside the modal boundary. The modal click checks incorrectly registered this as a background dismissal.
* **Fix**: Integrated a backdrop `onMouseDown` target tracking mechanism. Modal closures now only fire when both the click starts and ends directly on the backdrop overlay.
* **Impacted Files**: [Modal.tsx](file:///c:/Users/Kishore/Desktop/Qedit/QEdit-main/components/ui/Modal.tsx), [AdminClient.tsx](file:///c:/Users/Kishore/Desktop/Qedit/QEdit-main/app/admin/AdminClient.tsx)

## 3. Spellchecker Offset Bug with Apostrophes
* **Issue**: Dotted red underlines for misspelled words starting/ending with apostrophes (e.g. `'hello'` or `hello'`) were offset, underlining the wrong character index range.
* **Root Cause**: The error index offset was computed via subtracting word length from raw token length, which didn't account for whether apostrophes were leading or trailing.
* **Fix**: Used `raw.indexOf(word)` to fetch the exact relative character offset of the cleaned word inside the matched raw token.
* **Impacted Files**: [spellchecker.ts](file:///c:/Users/Kishore/Desktop/Qedit/QEdit-main/lib/spellchecker.ts)

## 4. Academic Punctuation with Question Numbering
* **Issue**: Typing sub-questions like `(a) What is deadlock` or `1. Explain deadlock` always ended with a period `.` instead of a question mark `?` because the leading identifiers masked the question starting words.
* **Root Cause**: The punctuation detector only inspected the very first word in the string, which evaluated to `(a)` or `1.`, failing to trigger the direct question starts rules.
* **Fix**: Created a `cleanLeadingPrefix` helper that iteratively strips standard sub-question labels (e.g. `1.`, `a)`, `(b)`, `i.`, `ii)`, `[Q1]`, `[5 Marks]`) to reveal the true sentence starter before classifying the punctuation.
* **Impacted Files**: [questionPunctuation.ts](file:///c:/Users/Kishore/Desktop/Qedit/QEdit-main/lib/utils/questionPunctuation.ts)

## 5. Review Actions Column Clipping
* **Issue**: The "OK" and "Rej" button options on the admin reviewer panel were clipped on the right-hand side.
* **Root Cause**: The Actions column width was constrained to `160px` which could not hold the preview, edit, download, and review action buttons.
* **Fix**: Expanded the Actions column width to `250px` (adjusting grid to `grid-cols-[1fr_200px_120px_130px_250px]`) and changed the labels to full words `Approve` and `Reject`.
* **Impacted Files**: [AdminClient.tsx](file:///c:/Users/Kishore/Desktop/Qedit/QEdit-main/app/admin/AdminClient.tsx)
