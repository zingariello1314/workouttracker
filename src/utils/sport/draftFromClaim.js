/**
 * Rédaction P6.5 : le texte final part de la thèse structurée,
 * pas d'un ancien paragraphe réécrit après coup.
 */

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

function bodyFromParts({ claim, exploration, discovery }) {
  const parts = [];
  const conclusion = cleanSentence(exploration?.conclusion || '');
  const statement = cleanSentence(claim?.statement || '');
  const legacy = cleanSentence(discovery?.body || discovery?.text || '');
  if (conclusion) parts.push(conclusion);
  else if (statement && statement !== conclusion) parts.push(statement);
  const retained = (exploration?.hypotheses || []).filter((row) => row.status === 'supported');
  if (retained.length && !conclusion) {
    parts.push(`Les observations retenues : ${retained.map((row) => row.detail).join(' ; ')}.`);
  }
  const limits = Array.isArray(claim?.limitations) ? claim.limitations.filter(Boolean) : [];
  if (limits.length) {
    parts.push(cleanSentence(limits[0]));
  }
  // Héritage uniquement s'il apporte une preuve absente de la thèse.
  if (legacy && !parts.some((part) => part.includes(legacy.slice(0, 40)))) {
    const evidence = cleanSentence(discovery?.evidence || '');
    if (evidence && legacy.includes(evidence.slice(0, Math.min(24, evidence.length)))) {
      // garder le corps hérité s'il porte encore les preuves chiffrées
      if (!conclusion) parts.push(legacy);
    }
  }
  let body = parts.filter(Boolean).join(' ');
  body = cleanSentence(body);
  const title = titleFromClaim(claim, discovery);
  if (title && body.startsWith(title)) {
    body = cleanSentence(body.slice(title.length).replace(/^[:.\s—-]+/, ''));
  }
  return body || legacy || statement;
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
    allowed.some((line) => body.includes(cleanSentence(line).slice(0, 24)) || title.includes(cleanSentence(line).slice(0, 24))) ||
    Boolean(exploration?.conclusion);
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
