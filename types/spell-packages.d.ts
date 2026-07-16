// Type declarations for packages that don't ship their own .d.ts files

declare module "nspell" {
  interface NSpell {
    correct(word: string): boolean;
    suggest(word: string): string[];
    add(word: string): NSpell;
  }
  interface DictionaryObject {
    aff: Buffer | string;
    dic: Buffer | string;
  }
  function nspell(dictionary: DictionaryObject): NSpell;
  export = nspell;
}
