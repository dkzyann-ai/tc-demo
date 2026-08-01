import type { Problem, TestPaper } from '../storage/models';

declare global {
  interface Window {
    desktop: {
      print: () => Promise<boolean>;
      problems: {
        list: (query?: string) => Promise<Problem[]>;
        save: (problem: Problem) => Promise<Problem>;
        delete: (id: string) => Promise<void>;
      };
      tests: {
        list: (query?: string) => Promise<TestPaper[]>;
        save: (test: TestPaper) => Promise<TestPaper>;
        delete: (id: string) => Promise<void>;
      };
    };
  }
}

export {};
