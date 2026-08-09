const STEP_RE = /^(\d+)\.\s*(.+)$/;
const PORTION_RE = /^Portion /i;

function finalizeStep(step) {
  if (!step) return;

  const body = [];
  step.body.forEach((t) => {
    const trimmed = t.trim();
    if (/^«.+»$/.test(trimmed) || (trimmed.startsWith('«') && trimmed.endsWith('»'))) {
      step.quotes.push(trimmed);
      return;
    }
    if (/^Cependant,/i.test(t) || /^Cependant /i.test(t)) {
      step.caveat = t;
      return;
    }
    body.push(t);
  });
  step.body = body;

  if (step.items?.length && step.items.some((it) => /RIR/i.test(it))) {
    step.rirScale = step.items.map((it) => {
      const colon = it.indexOf(':');
      const label = colon >= 0 ? it.slice(0, colon).trim() : it;
      const detail = colon >= 0 ? it.slice(colon + 1).trim() : '';
      return { label, detail: detail || it };
    });
    step.items = [];
  }

  const flows = [];
  const keepBody = [];
  step.body.forEach((t) => {
    if (t.includes('→')) {
      flows.push(t.split('→').map((s) => s.trim()).filter(Boolean));
    } else if (/^puis\s*:/i.test(t) || /^Pompes\s*:/i.test(t) || /^Par exemple\s*:/i.test(t)) {
      /* labels around flows */
    } else {
      keepBody.push(t);
    }
  });
  if (flows.length) step.flows = flows;
  step.body = keepBody;
}

/** Parse section recrutement « Comment développer » (étapes numérotées, erreurs, synthèse). */
export function progressionFromBlocks(blocks) {
  let intro = [];
  let steps = [];
  let currentStep = null;
  let mode = 'intro';
  let errors = null;
  let summary = null;
  let principle = null;
  let currentError = null;
  let currentPortion = null;
  let pendingExerciseLabel = null;
  let sawNumberedStep = false;

  const flushStep = () => {
    if (currentStep) {
      finalizeStep(currentStep);
      steps.push(currentStep);
      currentStep = null;
      currentPortion = null;
      pendingExerciseLabel = null;
    }
  };

  const flushError = () => {
    if (currentError && errors) {
      errors.items.push(currentError);
      currentError = null;
    }
  };

  (blocks || []).forEach((block) => {
    if (block.type === 'progressionFlow') {
      if (currentStep) {
        currentStep.flows = currentStep.flows || [];
        currentStep.flows.push(block.steps || []);
      }
      return;
    }
    if (block.type === 'rirScale') {
      if (currentStep) currentStep.rirScale = block.items;
      return;
    }
    if (block.type === 'progressionCaveat' && currentStep) {
      currentStep.caveat = block.text;
      return;
    }
    if (block.type === 'quotePair' && currentStep) {
      currentStep.quotes = block.quotes || [];
      return;
    }

    if (block.type === 'h3') {
      const t = block.text || '';
      const stepMatch = t.match(STEP_RE);

      if (/^En résumé$/i.test(t)) {
        flushStep();
        flushError();
        mode = 'summary';
        summary = { title: t, intro: [], bullets: [] };
        return;
      }

      if (/erreurs/i.test(t) && !stepMatch) {
        flushStep();
        mode = 'errors';
        errors = { title: t, items: [] };
        return;
      }

      if (mode === 'errors' && stepMatch) {
        flushError();
        currentError = {
          number: stepMatch[1],
          title: stepMatch[2],
          body: [],
          items: []
        };
        return;
      }

      if (stepMatch) {
        flushStep();
        mode = 'steps';
        sawNumberedStep = true;
        currentStep = {
          number: parseInt(stepMatch[1], 10),
          title: stepMatch[2],
          body: [],
          items: [],
          quotes: [],
          caveat: null,
          portions: [],
          exerciseGroups: [],
          rirScale: null,
          flows: []
        };
        currentPortion = null;
        pendingExerciseLabel = null;
        return;
      }

      if (currentStep && PORTION_RE.test(t)) {
        currentPortion = { name: t, body: [], items: [] };
        currentStep.portions.push(currentPortion);
        return;
      }
    }

    if (mode === 'intro') {
      if (block.type === 'p' && block.text) intro.push(block.text);
      return;
    }

    if (mode === 'summary') {
      if (block.type === 'p' && block.text) {
        if (/^Le principe fondamental/i.test(block.text)) {
          mode = 'principle';
          return;
        }
        if (/→/.test(block.text)) {
          const idx = block.text.indexOf('→');
          summary.bullets.push({
            strong: block.text.slice(0, idx).trim(),
            rest: block.text.slice(idx + 1).trim()
          });
        } else {
          summary.intro.push(block.text);
        }
      }
      return;
    }

    if (mode === 'principle' && block.type === 'p' && block.text) {
      principle = block.text;
      return;
    }

    if (currentError) {
      if (block.type === 'p') currentError.body.push(block.text);
      if (block.type === 'ul') currentError.items = block.items || [];
      return;
    }

    if (currentPortion) {
      if (block.type === 'p') currentPortion.body.push(block.text);
      if (block.type === 'ul') currentPortion.items = block.items || [];
      return;
    }

    if (currentStep) {
      if (block.type === 'p') {
        if (/^(Un mouvement|Éventuellement)/i.test(block.text)) {
          pendingExerciseLabel = block.text;
        } else if (!/^Exemple\s*:/i.test(block.text)) {
          currentStep.body.push(block.text);
        }
      }
      if (block.type === 'ul') {
        if (pendingExerciseLabel) {
          currentStep.exerciseGroups.push({
            label: pendingExerciseLabel,
            examples: (block.items || []).map((s) => String(s).trim())
          });
          pendingExerciseLabel = null;
        } else {
          currentStep.items.push(...(block.items || []));
        }
      }
    }
  });

  flushStep();
  flushError();

  return {
    intro,
    steps,
    errors,
    summary,
    principle,
    hasTimeline: sawNumberedStep && steps.length >= 3
  };
}

export function hasProgressionTimeline(blocks) {
  return progressionFromBlocks(blocks).hasTimeline;
}
