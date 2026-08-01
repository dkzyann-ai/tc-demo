import { FormEvent, useEffect, useState } from 'react';
import type { Problem, Subject, TestPaper } from '../storage/models';
import { TestBuilder } from '../features/test-builder/TestBuilder';
import { PrintPreview } from '../print/PrintPreview';

function emptyProblem(): Problem {
  return {
    id: '',
    title: '',
    subject: '数学I',
    unit: '',
    questionText: '',
    answerText: '',
    explanation: '',
    defaultPoints: 5,
    createdAt: '',
    updatedAt: '',
  };
}

export function App() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [editing, setEditing] = useState<Problem>(emptyProblem);
  const [filter, setFilter] = useState<'すべて' | Subject>('すべて');
  const [message, setMessage] = useState('');
  const [printTest, setPrintTest] = useState<TestPaper>();

  const loadProblems = async () => {
    setProblems(await window.desktop.problems.list());
  };

  useEffect(() => {
    void loadProblems();
  }, []);

  const saveProblem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing.title.trim() || !editing.unit.trim() || !editing.questionText.trim() || !editing.answerText.trim()) {
      setMessage('タイトル、単元、問題文、正答を入力してください。');
      return;
    }

    await window.desktop.problems.save({
      ...editing,
      title: editing.title.trim(),
      unit: editing.unit.trim(),
    });
    setEditing(emptyProblem());
    setMessage('問題を保存しました。');
    await loadProblems();
  };

  const deleteProblem = async (problem: Problem) => {
    if (!window.confirm('「' + problem.title + '」を削除しますか？')) {
      return;
    }

    try {
      await window.desktop.problems.delete(problem.id);
      setMessage('問題を削除しました。');
      await loadProblems();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '問題を削除できませんでした。');
    }
  };

  const visibleProblems = problems.filter((problem) => filter === 'すべて' || problem.subject === filter);

  return (
    <main>
      <header>
        <p>数学I・A / ローカル版</p>
        <h1>テスト作成ツール DEMO</h1>
        <span>問題バンク</span>
      </header>

      <section>
        <h2>{editing.id ? '問題を編集' : '問題を登録'}</h2>
        <form onSubmit={saveProblem}>
          <div className="form-grid">
            <label>タイトル<input value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} /></label>
            <label>教科<select value={editing.subject} onChange={(event) => setEditing({ ...editing, subject: event.target.value as Subject })}><option>数学I</option><option>数学A</option></select></label>
            <label>単元<input value={editing.unit} onChange={(event) => setEditing({ ...editing, unit: event.target.value })} placeholder="例：数と式" /></label>
            <label>標準配点<input type="number" min="1" value={editing.defaultPoints} onChange={(event) => setEditing({ ...editing, defaultPoints: Number(event.target.value) })} /></label>
          </div>
          <label>問題文<textarea value={editing.questionText} onChange={(event) => setEditing({ ...editing, questionText: event.target.value })} /></label>
          <label>正答<textarea value={editing.answerText} onChange={(event) => setEditing({ ...editing, answerText: event.target.value })} /></label>
          <label>解説（任意）<textarea value={editing.explanation} onChange={(event) => setEditing({ ...editing, explanation: event.target.value })} /></label>
          <div className="actions"><button type="button" className="secondary" onClick={() => setEditing(emptyProblem())}>入力を取り消す</button><button type="submit">問題を保存</button></div>
        </form>
        {message ? <p role="alert">{message}</p> : null}
      </section>

      <section>
        <div className="section-header"><h2>登録済み問題</h2><div className="filters">{(['すべて', '数学I', '数学A'] as const).map((item) => <button type="button" className={filter === item ? 'active-filter' : 'secondary'} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div></div>
        {visibleProblems.length === 0 ? <p>登録済みの問題はありません。</p> : <div className="problem-list">{visibleProblems.map((problem) => <article key={problem.id}><div><strong>{problem.title}</strong><p>{problem.subject}・{problem.unit}／{problem.defaultPoints}点</p><p className="question">{problem.questionText}</p></div><div className="actions"><button type="button" className="secondary" onClick={() => setEditing(problem)}>編集</button><button type="button" className="danger" onClick={() => void deleteProblem(problem)}>削除</button></div></article>)}</div>}
      </section>
      <TestBuilder problems={problems} onOpenTest={setPrintTest} />
      <PrintPreview test={printTest} problems={problems} />
    </main>
  );
}
