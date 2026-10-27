/** A small deterministic random number generator (mulberry32): the same seed always gives the same sequence. */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Turns text such as a question id into a number to seed the shuffle with. */
export function seedFrom(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  }
  return hash >>> 0;
}

/**
 * A shuffled copy of the items. The same seed gives the same order, so a screen that re-renders does not
 * reshuffle (seed with the id of the question or assignment); different respondents seed differently.
 */
export function shuffleWithSeed<T>(items: readonly T[], seed: number): T[] {
  const random = createRandom(seed);
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
