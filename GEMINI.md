# BESM 4E Character Architect - Development Rules & Guidelines

## Core Principles

1. **Always Push Changes to Git**:
   - Every time code, configuration, or documentation changes are made and verified, commit the changes with a clear, descriptive message and immediately push to GitHub (`git push origin main`). Never leave commits unpushed.

2. **Automated Verification & Test Suite**:
   - Always execute `node test_suite.js` and verify that all test suites pass with zero failures.
   - When adding features or changing behaviors, add or update tests to maintain full test coverage.

3. **Typography Standard (Accessibility & Readability)**:
   - Maintain a strict minimum of 12pt (16px) font size across the entire application for all UI elements, buttons, inputs, selects, labels, dropdowns, and modals.

4. **Modal DOM Hierarchy (Depth 0)**:
   - All modal dialogs must exist as direct siblings at root depth 0 directly under `<body>`. Never nest modals inside other containers or other modals.
