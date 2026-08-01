import { useMemo, useState } from 'react';
import type { Problem, TestPaper } from '../storage/models';

type Props = {
  test: TestPaper | undefined;
  problems: Problem[];
};

type PageKind = 'question' | 'answer-sheet' | 'answer-key';

export function PrintPreview({ test, problems }: Props) {
  const [kind, setKind] = useState<PageKind>('question');
  const entries = useMemo(() => {
    if (!test) return [];
    return [...test.items].sort((left, right) => left.order - right.order).map((item) => ({
      item,
      problem: problems.find((problem) => problem.id === item.problemId),
    }));
  }, [test, problems]);

  if (!test) {
    return <section className="print-preview"><h2>印刷プレビュー</h2><p>保存済みテストを「再編集」で開くと、ここで問題用紙・解答用紙・答えを確認できます。</p></section>;
  }

  const title = kind === 'question' ? '問題用紙' : kind === 'answer-sheet' ? '解答用紙' : '答え';

  return <section className="print-preview">
    <div className="no-print section-header"><h2>印刷プレビュー</h2><div className="filters"><button type="button" className={kind === 'question' ? 'active-filter' : 'secondary'} onClick={() => setKind('question')}>問題用紙</button><button type="button" className={kind === 'answer-sheet' ? 'active-filter' : 'secondary'} onClick={() => setKind('answer-sheet')}>解答用紙</button><button type="button" className={kind === 'answer-key' ? 'active-filter' : 'secondary'} onClick={() => setKind('answer-key')}>答え</button><button type="button" onClick={() => void window.desktop.print()}>印刷</button></div></div>
    <article className="a4-page">
      <p className="print-label">{title}</p>
      <h1>{test.name}</h1>
      {kind !== 'answer-key' ? <p className="student-fields">年　組　番　氏名：＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿</p> : null}
      {entries.map(({ item, problem }, index) => <div className="print-question" key={item.problemId}>
        <div className="print-question-title">第{index + 1}問　{kind === 'answer-key' ? item.points + '点' : '（' + item.points + '点）'}</div>
        {kind === 'answer-sheet' ? <div className="answer-box">第{index + 1}問　解答欄</div> : <><p>{problem?.questionText ?? '問題が削除されています。'}</p>{kind === 'answer-key' ? <><p><strong>正答：</strong>{problem?.answerText}</p>{problem?.explanation ? <p><strong>解説：</strong>{problem.explanation}</p> : null}</> : null}</>}
      </div>)}
    </article>
  </section>;
}
