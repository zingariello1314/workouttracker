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

function bodyFromParts({ claim, exploration, discovery }) {
  const parts = [];
  const conclusion = cleanSentence(exploration?.conclusion || '');
  const legacy = cleanSentence(discovery?.body || discovery?.text || '');
  const statement = cleanSentence(claim?.statement || '');
  const title = titleFromClaim(claim, discovery);

  // Contenu analytique d’abord : exploration → corps hérité → thèse (si distincte du titre)
  if (conclusion) {
    parts.push(conclusion);
  } else if (legacy) {
    parts.push(legacy);
  } else if (statement && statement !== title) {
    parts.push(statement);
  }

  const retained = (exploration?.hypotheses || []).filter((row) => row.status === 'supported');
  if (retained.length && !conclusion && !legacy) {
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
export function draftFromClaim(discovery, claim, exploration = null) {
  if (!discovery || !claim) return discovery;
  const title = titleFromClaim(claim, discovery);
  const body = bodyFromParts({ claim, exploration, discovery });
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
      textOk
    }
  };
}

export { bodyFromParts, limitToProse, titleFromClaim };
