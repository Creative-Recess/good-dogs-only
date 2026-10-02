// MOCK (branch mock/breed-facts): breed facts for three example breeds, to try the Breed facts section.
export type BreedFacts = { height: string; weight: string; life: string; origin: string; job: string }

export const FACTS: Record<string, BreedFacts> = {
  'labrador-retriever': { height: '55–62 cm', weight: '25–36 kg', life: '10–12 yrs', origin: 'UK', job: 'Bred to fetch ducks and game birds from the water for hunters.' },
  dachshund: { height: '20–27 cm', weight: '7–15 kg', life: '12–16 yrs', origin: 'Germany', job: 'Bred to follow badgers down their burrows. "Dachs" is German for badger.' },
  'border-collie': { height: '46–56 cm', weight: '14–20 kg', life: '12–15 yrs', origin: 'Scotland & England', job: 'Bred to herd sheep in the hills along the Scottish–English border.' },
}
