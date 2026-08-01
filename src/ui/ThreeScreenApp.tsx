import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import type { Problem, Subject, TestItem, TestKind, TestPaper } from '../storage/models';
import './three-screen.css';

type Screen = 'create' | 'history' | 'problem';
type PaperKind = 'question' | 'answer';

const subjects: Subject[] = ['数学Ⅰ・A', '数学Ⅰ・B', '数学Ⅱ・B', '数学Ⅲ・C'];
const testKinds: TestKind[] = ['小テスト', '定期テスト'];

const emptyProblem = (subject: Subject): Problem => ({
  id: '',
  title: '',
  subject,
  unit: '',
  format: '記述',
  defaultPoints: 5,
  questionText: '',
  answerText: '',
  explanation: '',
  imageData: '',
  createdAt: '',
  updatedAt: '',
});

const emptyTest = (kind: TestKind, subject: Subject): TestPaper => ({
  id: '',
  name: '無題の' + kind,
  kind,
  subject,
  items: [],
  createdAt: '',
  updatedAt: '',
});

function readImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('画像を読み込めませんでした。'));
    reader.readAsDataURL(file);
  });
}

function formatDate(value: string) {
  return value ? new Intl.DateTimeFormat('ja-JP', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '';
}

export function ThreeScreenApp() {
  const [screen, setScreen] = useState<Screen>('create');
  const [paperKind, setPaperKind] = useState<PaperKind>('question');
  const [kind, setKind] = useState<TestKind>('小テスト');
  const [subject, setSubject] = useState<Subject>('数学Ⅰ・A');
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const [subjectMenuOpen, setSubjectMenuOpen] = useState(false);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [allProblems, setAllProblems] = useState<Problem[]>([]);
  const [tests, setTests] = useState<TestPaper[]>([]);
  const [problemQuery, setProblemQuery] = useState('');
  const [testQuery, setTestQuery] = useState('');
  const [editingProblem, setEditingProblem] = useState<Problem>(emptyProblem('数学Ⅰ・A'));
  const [activeTest, setActiveTest] = useState<TestPaper>();
  const [testName, setTestName] = useState('無題の小テスト');
  const [items, setItems] = useState<TestItem[]>([]);
  const [message, setMessage] = useState('');

  const loadProblems = async (query = problemQuery) => {
    const loaded = await window.desktop.problems.list(query);
    setProblems(loaded);
    if (!query) setAllProblems(loaded);
  };
  const loadTests = async (query = testQuery) => setTests(await window.desktop.tests.list(query));

  useEffect(() => { void loadProblems(problemQuery); }, [problemQuery]);
  useEffect(() => { void loadTests(testQuery); }, [testQuery]);

  const displayedProblems = useMemo(
    () => problems.filter((problem) => problem.subject === subject),
    [problems, subject],
  );
  const orderedItems = useMemo(() => [...items].sort((left, right) => left.order - right.order), [items]);
  const entries = useMemo(() => orderedItems.map((item) => ({
    item,
    problem: allProblems.find((problem) => problem.id === item.problemId),
  })), [allProblems, orderedItems]);
  const total = orderedItems.reduce((sum, item) => sum + item.points, 0);

  const normalize = (next: TestItem[]) => next.map((item, index) => ({ ...item, order: index + 1 }));

  const selectKind = (next: TestKind) => {
    setKind(next);
    setTypeMenuOpen(false);
    if (!activeTest && testName === '無題の' + kind) setTestName('無題の' + next);
  };

  const selectSubject = (next: Subject) => {
    setSubject(next);
    setSubjectMenuOpen(false);
    if (!activeTest) setItems([]);
  };

  const toggleProblem = (problem: Problem) => {
    const chosen = items.some((item) => item.problemId === problem.id);
    setItems(normalize(chosen ? items.filter((item) => item.problemId !== problem.id) : [
      ...items,
      { problemId: problem.id, points: problem.defaultPoints, order: items.length + 1 },
    ]));
  };

  const updatePoints = (problemId: string, points: number) => {
    setItems(items.map((item) => item.problemId === problemId ? { ...item, points: Math.max(1, points || 1) } : item));
  };

  const move = (index: number) => {
    if (index === 0) return;
    const next = [...orderedItems];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setItems(normalize(next));
  };

  const saveTest = async () => {
    if (!testName.trim() || items.length === 0) {
      setMessage('テスト名と、少なくとも1問の問題を設定してください。');
      return;
    }
    const saved = await window.desktop.tests.save({
      id: activeTest?.id ?? '',
      name: testName.trim(),
      kind,
      subject,
      items: normalize(items),
      createdAt: activeTest?.createdAt ?? '',
      updatedAt: '',
    });
    setActiveTest(saved);
    setItems(saved.items);
    setMessage('テストを保存しました。');
    await loadTests('');
  };

  const openTest = (test: TestPaper) => {
    setActiveTest(test);
    setKind(test.kind ?? '小テスト');
    setSubject(test.subject ?? '数学Ⅰ・A');
    setTestName(test.name);
    setItems(test.items);
    setScreen('create');
    setMessage('保存済みテストを開きました。');
  };

  const startProblemCreate = () => {
    setEditingProblem(emptyProblem(subject));
    setScreen('problem');
    setMessage('');
  };

  const saveProblem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingProblem.title.trim() || !editingProblem.unit.trim() || !editingProblem.questionText.trim() || !editingProblem.answerText.trim()) {
      setMessage('問題名、単元、問題文、答えを入力してください。');
      return;
    }
    const saved = await window.desktop.problems.save({
      ...editingProblem,
      title: editingProblem.title.trim(),
      unit: editingProblem.unit.trim(),
    });
    setSubject(saved.subject);
    setItems((current) => current.some((item) => item.problemId === saved.id) ? current : normalize([
      ...current,
      { problemId: saved.id, points: saved.defaultPoints, order: current.length + 1 },
    ]));
    setProblemQuery('');
    await loadProblems('');
    setEditingProblem(emptyProblem(saved.subject));
    setScreen('create');
    setMessage('問題を保存し、今回のテストへ追加しました。');
  };

  const deleteProblem = async (problem: Problem) => {
    if (!window.confirm('「' + problem.title + '」を削除しますか？')) return;
    try {
      await window.desktop.problems.delete(problem.id);
      await loadProblems();
      setMessage('問題を削除しました。');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '問題を削除できませんでした。');
    }
  };

  const deleteTest = async (test: TestPaper) => {
    if (!window.confirm('「' + test.name + '」を削除しますか？')) return;
    await window.desktop.tests.delete(test.id);
    await loadTests();
    setMessage('テストを削除しました。');
  };

  const onImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setEditingProblem({ ...editingProblem, imageData: await readImage(file) });
  };

  return (
    <main className="tool-app">
      <header className="tool-header">
        <div className="tool-brand"><small>Beta</small><strong>テスト作成ツール</strong></div>
        <nav className="tool-nav" aria-label="画面移動">
          <button type="button" className={screen === 'create' ? 'is-active' : ''} onClick={() => setScreen('create')}>テスト作成</button>
          <button type="button" className={screen === 'history' ? 'is-active' : ''} onClick={() => setScreen('history')}>テスト履歴</button>
          <button type="button" className={screen === 'problem' ? 'is-active' : ''} onClick={startProblemCreate}>問題作成</button>
        </nav>
      </header>

      {message ? <p className="tool-message" role="status">{message}</p> : null}

      {screen === 'create' ? <section className="tool-screen">
        <div className="test-toolbar">
          <div className="menu-wrap">
            <button type="button" className="picker-button" onClick={() => { setTypeMenuOpen(!typeMenuOpen); setSubjectMenuOpen(false); }}>{kind} ▾</button>
            {typeMenuOpen ? <div className="vertical-menu">{testKinds.map((item) => <button type="button" className={item === kind ? 'is-active' : ''} key={item} onClick={() => selectKind(item)}>{item}</button>)}</div> : null}
          </div>
          <div className="menu-wrap">
            <button type="button" className="picker-button subject-picker" onClick={() => { setSubjectMenuOpen(!subjectMenuOpen); setTypeMenuOpen(false); }}>{subject} ▾</button>
            {subjectMenuOpen ? <div className="vertical-menu">{subjects.map((item) => <button type="button" className={item === subject ? 'is-active' : ''} key={item} onClick={() => selectSubject(item)}>{item}</button>)}</div> : null}
          </div>
          <input className="test-name" value={testName} onChange={(event) => setTestName(event.target.value)} aria-label="テスト名" />
          <button type="button" className="primary-action" onClick={() => void saveTest()}>テストを保存</button>
        </div>

        <div className="create-grid">
          <aside className="side-pane">
            <div className="pane-heading"><h2>問題一覧</h2><input value={problemQuery} onChange={(event) => setProblemQuery(event.target.value)} placeholder="問題を検索" aria-label="問題を検索" /></div>
            {displayedProblems.length === 0 ? <p className="empty-list">問題作成から問題を登録してください。</p> : displayedProblems.map((problem) => <button type="button" className={'problem-select ' + (items.some((item) => item.problemId === problem.id) ? 'is-selected' : '')} key={problem.id} onClick={() => toggleProblem(problem)}><strong>{problem.title}</strong><span>{problem.unit}・{problem.defaultPoints}点</span></button>)}
          </aside>

          <div className="paper-pane">
            <div className="paper-tabs"><button type="button" className={paperKind === 'question' ? 'is-active' : ''} onClick={() => setPaperKind('question')}>問題用紙</button><button type="button" className={paperKind === 'answer' ? 'is-active' : ''} onClick={() => setPaperKind('answer')}>答え</button><button type="button" className="print-button" onClick={() => void window.desktop.print()}>印刷</button></div>
            <article id="print-sheet" className="print-sheet">
              <div className="paper-meta"><span>{kind}／{subject}</span>{paperKind === 'question' ? <span>氏名：＿＿＿＿＿＿＿＿＿＿＿＿</span> : null}</div>
              <h1>{testName || '無題のテスト'}</h1>
              {entries.length === 0 ? <p className="paper-empty">左の問題一覧から問題を選択してください。</p> : entries.map(({ item, problem }, index) => <div className="paper-question" key={item.problemId}><div><strong>第{index + 1}問</strong><span>（{item.points}点）</span></div><p>{problem?.questionText ?? '問題が削除されています。'}</p>{paperKind === 'question' && problem?.imageData ? <img src={problem.imageData} alt={problem.title + 'の添付画像'} /> : null}{paperKind === 'answer' ? <><p className="correct-answer">正答：{problem?.answerText}</p>{problem?.explanation ? <p>解説：{problem.explanation}</p> : null}</> : null}</div>)}
            </article>
          </div>

          <aside className="side-pane">
            <div className="pane-heading"><h2>出題順・配点</h2><span>{orderedItems.length}問</span></div>
            {entries.length === 0 ? <p className="empty-list">問題を選択すると、順番と配点を調整できます。</p> : entries.map(({ item, problem }, index) => <div className="selected-item" key={item.problemId}><button type="button" onClick={() => move(index)} disabled={index === 0}>↑</button><div><strong>{index + 1}. {problem?.title ?? '削除済みの問題'}</strong><small>出題順を変更できます</small></div><input type="number" min="1" value={item.points} onChange={(event) => updatePoints(item.problemId, Number(event.target.value))} aria-label={(problem?.title ?? '問題') + 'の配点'} /></div>)}
            <p className="total-points">合計 {total}点</p>
          </aside>
        </div>
      </section> : null}

      {screen === 'history' ? <section className="tool-screen history-screen">
        <div className="screen-title"><div><h1>テスト履歴</h1><p>保存済みのテストを開き、再編集・印刷できます。</p></div><input value={testQuery} onChange={(event) => setTestQuery(event.target.value)} placeholder="テストを検索" aria-label="テストを検索" /></div>
        {tests.length === 0 ? <p className="empty-history">保存済みのテストはありません。</p> : <table><thead><tr><th>作成日時</th><th>テスト名</th><th>種別・科目</th><th>問題数</th><th>合計点</th><th></th></tr></thead><tbody>{tests.map((test) => <tr key={test.id}><td>{formatDate(test.createdAt)}</td><td><strong>{test.name}</strong></td><td>{test.kind ?? '小テスト'}／{test.subject ?? '数学Ⅰ・A'}</td><td>{test.items.length}問</td><td>{test.items.reduce((sum, item) => sum + item.points, 0)}点</td><td><button type="button" className="small-button" onClick={() => openTest(test)}>再編集</button><button type="button" className="delete-button" onClick={() => void deleteTest(test)}>削除</button></td></tr>)}</tbody></table>}
      </section> : null}

      {screen === 'problem' ? <section className="tool-screen problem-screen">
        <div className="screen-title"><div><h1>{editingProblem.id ? '問題を編集' : '問題作成'}</h1><p>保存した問題は、テスト作成画面の問題一覧へ追加されます。</p></div></div>
        <form onSubmit={saveProblem}>
          <div className="problem-grid">
            <label>問題名<input value={editingProblem.title} onChange={(event) => setEditingProblem({ ...editingProblem, title: event.target.value })} required /></label>
            <label>科目<select value={editingProblem.subject} onChange={(event) => setEditingProblem({ ...editingProblem, subject: event.target.value as Subject })}>{subjects.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>配点<input type="number" min="1" value={editingProblem.defaultPoints} onChange={(event) => setEditingProblem({ ...editingProblem, defaultPoints: Number(event.target.value) })} required /></label>
            <label>単元<input value={editingProblem.unit} onChange={(event) => setEditingProblem({ ...editingProblem, unit: event.target.value })} placeholder="例：2次関数" required /></label>
            <label>問題形式<select value={editingProblem.format ?? '記述'} onChange={(event) => setEditingProblem({ ...editingProblem, format: event.target.value as Problem['format'] })}><option>記述</option><option>選択</option><option>数値</option></select></label>
            <label>画像（任意）<input type="file" accept="image/*" onChange={(event) => void onImageChange(event)} />{editingProblem.imageData ? <small>画像を設定しました。</small> : null}</label>
          </div>
          <label>問題文<textarea value={editingProblem.questionText} onChange={(event) => setEditingProblem({ ...editingProblem, questionText: event.target.value })} required /></label>
          <div className="two-column"><label>答え<textarea value={editingProblem.answerText} onChange={(event) => setEditingProblem({ ...editingProblem, answerText: event.target.value })} required /></label><label>解説（任意）<textarea value={editingProblem.explanation} onChange={(event) => setEditingProblem({ ...editingProblem, explanation: event.target.value })} /></label></div>
          <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setScreen('create')}>キャンセル</button><button type="submit" className="primary-action">問題を保存してテスト作成へ</button></div>
        </form>
        <div className="registered-problems"><div className="pane-heading"><h2>登録済み問題</h2><input value={problemQuery} onChange={(event) => setProblemQuery(event.target.value)} placeholder="問題を検索" aria-label="登録済み問題を検索" /></div>{problems.map((problem) => <div className="registered-row" key={problem.id}><span><strong>{problem.title}</strong><small>{problem.subject}・{problem.unit}・{problem.defaultPoints}点</small></span><button type="button" className="small-button" onClick={() => { setEditingProblem(problem); setMessage('問題を編集できます。'); }}>編集</button><button type="button" className="delete-button" onClick={() => void deleteProblem(problem)}>削除</button></div>)}</div>
      </section> : null}
    </main>
  );
}
