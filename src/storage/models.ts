export type Subject = '数学Ⅰ・A' | '数学Ⅰ・B' | '数学Ⅱ・B' | '数学Ⅲ・C' | '数学I' | '数学A';

export type ProblemFormat = '記述' | '選択' | '数値';
export type TestKind = '小テスト' | '定期テスト';

export type Problem = {
  id: string;
  title: string;
  subject: Subject;
  unit: string;
  questionText: string;
  answerText: string;
  explanation: string;
  format?: ProblemFormat;
  defaultPoints: number;
  imageData?: string;
  createdAt: string;
  updatedAt: string;
};

export type TestItem = {
  problemId: string;
  points: number;
  order: number;
};

export type TestPaper = {
  id: string;
  name: string;
  kind?: TestKind;
  subject?: Subject;
  items: TestItem[];
  createdAt: string;
  updatedAt: string;
};
