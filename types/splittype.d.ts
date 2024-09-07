declare module 'split-type' {
  interface SplitTypeOptions {
    types?: string | string[];
    tagName?: string;
    // Add other options as needed
  }

  class SplitType {
    constructor(target: string | Element, options?: SplitTypeOptions);
    // Add methods as needed
  }

  export default SplitType;
}
