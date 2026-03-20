/**
 * Genre Matcher Helper
 * Checks if a detected genre matches venue's preferred genres
 */

/* -------------------- NORMALIZE GENRE -------------------- */
function normalizeGenre(genre) {
  return genre
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "");
}

/* -------------------- CHECK GENRE MATCH -------------------- */
function isGenreMatch(detectedGenre, preferredGenres) {
  if (!preferredGenres || preferredGenres.length === 0) {
    // If no genres are set, allow all songs
    return {
      isMatch: true,
      message: "No genre restrictions set for this venue"
    };
  }

  const normalizedDetected = normalizeGenre(detectedGenre);
  
  // Check exact matches
  const exactMatch = preferredGenres.some(genre => {
    return normalizeGenre(genre) === normalizedDetected;
  });

  if (exactMatch) {
    return {
      isMatch: true,
      message: `Genre "${detectedGenre}" matches venue preferences`,
      detectedGenre,
      matchedWith: preferredGenres.find(genre => normalizeGenre(genre) === normalizedDetected)
    };
  }

  // Check partial matches (containing)
  const partialMatch = preferredGenres.some(genre => {
    const normalized = normalizeGenre(genre);
    return (
      normalized.includes(normalizedDetected) ||
      normalizedDetected.includes(normalized)
    );
  });

  if (partialMatch) {
    return {
      isMatch: true,
      message: `Genre "${detectedGenre}" matches venue preferences`,
      detectedGenre,
      matchedWith: preferredGenres.find(genre => {
        const normalized = normalizeGenre(genre);
        return (
          normalized.includes(normalizedDetected) ||
          normalizedDetected.includes(normalized)
        );
      })
    };
  }

  // No match
  return {
    isMatch: false,
    message: `Genre "${detectedGenre}" does not match venue preferences: ${preferredGenres.join(", ")}`,
    detectedGenre,
    preferredGenres
  };
}

module.exports = {
  isGenreMatch,
  normalizeGenre
};
