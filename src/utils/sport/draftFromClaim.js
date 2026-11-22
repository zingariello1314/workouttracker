/**
 * Rédaction P6.5 : le texte final part de la thèse structurée,
 * pas d'un ancien paragraphe réécrit après coup.
 */

/** Codes de limitation → prose naturelle (ou null = ne pas injecter dans le corps). */
const LIMIT_PROSE = Object.freeze({
  association_not_causation:
    'Association descriptive observée : ce n’est pas une preuve que le sommeil cause le volume ou la performance.',
  association_only: null,
  non_numeric_documentary_proof: null,
  multi_threshold_consolidated: 'Plusieurs seuils convergent vers la même lecture descriptive.',
  missing_claim: null
});

function cleanSentence(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([,;:])\s*([A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ])/g, (_, p, letter) => `${p} ${letter.toLowerCase()}`)
    .replace(/\bnull\b/gi, '—')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function titleFromClaim(claim, discovery) {
  const statement = cleanSentence(claim?.statement || discovery?.title || '');
  if (!statement) return discovery?.title || '';
  // Un titre n'est pas un paragraphe entier.
  if (statement.length > 110 || /[.!?].+[.!?]/.test(statement)) {
    const first = statement.split(/[.!?]/)[0] || statement;
    return cleanSentence(first).slice(0, 110);
  }
  return statement;
}

function limitToProse(code) {
  const key = String(code || '').trim();
  if (!key) return null;
  if (Object.prototype.hasOwnProperty.call(LIMIT_PROSE, key)) return LIMIT_PROSE[key];
  // Ne jamais publier un identifiant technique brut comme corps.
  if (/^[a-z0-9_]+$/i.test(key) && key.includes('_')) return null;
  return cleanSentence(key);
}

/**
 * Mission 19 — autorité narrative : une conclusion déjà composée / thèse établie
 * ne doit pas être écrasée par une ré-exploration brute.
 */
function authoritativeBody(discovery, exploration) {
  const composed = cleanSentence(discovery?.metrics?.composition?.conclusion || '');
  const authority = String(
    discovery?.metrics?.narrativeAuthority || discovery?.drafting?.authority || ''
  );
  const legacy = cleanSentence(discovery?.body || discovery?.text || '');
  const conclusion = cleanSentence(exploration?.conclusion || '');
  if (authority === 'composition' && (composed || legacy)) {
    return composed || legacy;
  }
  if (composed && discovery?.metrics?.thesis) {
    return composed;
  }
  if (
    /variant_mix_shift|collective_return|program_variant_mix/i.test(
      `${discovery?.metrics?.thesis || ''} ${discovery?.metrics?.composition || ''} ${discovery?.kind || ''}`
    ) &&
    legacy
  ) {
    // Préférer le corps déjà aligné à la thèse plutôt qu’une conclusion d’exploration plate.
    return legacy;
  }
  return conclusion || legacy;
}

function bodyFromParts({ claim, exploration, discovery }) {
  const parts = [];
  const legacy = cleanSentence(discovery?.body || discovery?.text || '');
  const statement = cleanSentence(claim?.statement || '');
  const title = titleFromClaim(claim, discovery);
  const primary = authoritativeBody(discovery, exploration);

  // Contenu analytique : autorité établie → exploration → thèse
  if (primary) {
    parts.push(primary);
  } else if (statement && statement !== title) {
    parts.push(statement);
  }

  const retained = (exploration?.hypotheses || []).filter((row) => row.status === 'supported');
  if (retained.length && !primary) {
    parts.push(`Les observations retenues : ${retained.map((row) => row.detail).join(' ; ')}.`);
  }

  // Limitations structurées → prose utile uniquement si le corps ne l’exprime déjà pas
  const limits = Array.isArray(claim?.limitations) ? claim.limitations.filter(Boolean) : [];
  const bodySoFar = parts.join(' ').toLowerCase();
  for (const lim of limits) {
    const prose = limitToProse(lim);
    if (!prose) continue;
    if (/caus|association|pas une preuve/i.test(bodySoFar) && /caus|association/i.test(prose)) {
      continue;
    }
    parts.push(prose);
    break; // une seule précision méthodologique dans le corps public
  }

  let body = parts.filter(Boolean).join(' ');
  body = cleanSentence(body);
  if (title && body.startsWith(title)) {
    body = cleanSentence(body.slice(title.length).replace(/^[:.\s—-]+/, ''));
  }
  // Garde-fou : jamais un corps = code technique seul, ni limitation seule si un corps analytique existe
  const onlyLimit =
    body &&
    Object.values(LIMIT_PROSE).some((p) => p && body === cleanSentence(p));
  if (!body || /^[a-z0-9_]+$/i.test(body) || (onlyLimit && legacy && legacy.length > body.length)) {
    body = legacy || (statement !== title ? statement : '') || body || '';
  }
  return body;
}

/**
 * Réécrit title/body à partir du claim et de l'exploration.
 * Ne fabrique aucune assertion absente du claim.
 */
/**
 * Mission 20 — détecte contradiction de direction titre ↔ delta numérique,
 * sans liste spéciale de kinds.
 */
function resolveDirectionAwareTitle(title, discovery, body) {
  const metrics = discovery?.metrics || {};
  const delta =
    metrics.deltaVolume ??
    metrics.decomposition?.deltaVolume ??
    (Array.isArray(metrics.observedValues)
      ? metrics.observedValues.find((v) => v?.id === 'deltaVolume')?.value
      : null);
  if (!Number.isFinite(Number(delta))) return { title, directionMismatch: false };
  const n = Number(delta);
  const titleText = String(title || '');
  const bodyText = String(body || '');
  const saysUp = /hausse|augmentation|monte|progression de volume/i.test(titleText);
  const saysDown = /baisse|diminution|recul|baisse de volume/i.test(titleText);
  if (n < -30 && saysUp) {
    const fixed = titleText.replace(/hausse/gi, 'baisse').replace(/augmentation/gi, 'diminution');
    return { title: fixed, directionMismatch: true, expected: 'down' };
  }
  if (n > 30 && saysDown) {
    const fixed = titleText.replace(/baisse/gi, 'hausse').replace(/diminution/gi, 'augmentation');
    return { title: fixed, directionMismatch: true, expected: 'up' };
  }
  // Corps vs titre : « baisse » chiffrée dans le corps avec titre « hausse »
  if (saysUp && /passe de\s+\d[\d\s]*\s+à\s+\d/i.test(bodyText)) {
    const m = bodyText.match(/passe de\s+([\d\s]+)\s+à\s+([\d\s]+)/i);
    if (m) {
      const a = parseInt(String(m[1]).replace(/\s/g, ''), 10);
      const b = parseInt(String(m[2]).replace(/\s/g, ''), 10);
      if (Number.isFinite(a) && Number.isFinite(b) && b < a * 0.92) {
        return {
          title: titleText.replace(/hausse/gi, 'baisse').replace(/augmentation/gi, 'diminution'),
          directionMismatch: true,
          expected: 'down'
        };
      }
    }
  }
  return { title, directionMismatch: false };
}

export function draftFromClaim(discovery, claim, exploration = null) {
  if (!discovery || !claim) return discovery;
  let title = titleFromClaim(claim, discovery);
  const body = bodyFromParts({ claim, exploration, discovery });
  const directionFix = resolveDirectionAwareTitle(title, discovery, body);
  title = directionFix.title;
  const allowed = Array.isArray(claim.allowedStatements) ? claim.allowedStatements : [];
  const textOk =
    !allowed.length ||
    allowed.some(
      (line) =>
        body.includes(cleanSentence(line).slice(0, 24)) ||
        title.includes(cleanSentence(line).slice(0, 24)) ||
        line === 'association_only'
    ) ||
    Boolean(exploration?.conclusion) ||
    Boolean(discovery?.body);
  return {
    ...discovery,
    title,
    body,
    text: body,
    claim: {
      ...claim,
      statement: title,
      status: textOk ? claim.status || 'supported' : 'text_claim_mismatch'
    },
    drafting: {
      authority: 'claim',
      explorationCoverage: exploration?.coverage || null,
      textOk,
      directionMismatch: directionFix.directionMismatch || false
    }
  };
}

export { bodyFromParts, limitToProse, titleFromClaim };
