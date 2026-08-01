const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

function createLocalStore(databasePath) {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const database = new DatabaseSync(databasePath);
  database.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS problems (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subject TEXT NOT NULL,
      unit TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS test_papers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      subject TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      data TEXT NOT NULL
    );
  `);

  const problemById = database.prepare('SELECT data FROM problems WHERE id = ?');
  const testById = database.prepare('SELECT data FROM test_papers WHERE id = ?');
  const saveProblemStatement = database.prepare(`
    INSERT INTO problems (id, title, subject, unit, updated_at, data)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      subject = excluded.subject,
      unit = excluded.unit,
      updated_at = excluded.updated_at,
      data = excluded.data
  `);
  const saveTestStatement = database.prepare(`
    INSERT INTO test_papers (id, name, kind, subject, updated_at, data)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      kind = excluded.kind,
      subject = excluded.subject,
      updated_at = excluded.updated_at,
      data = excluded.data
  `);

  function parseRows(rows) {
    return rows.map((row) => JSON.parse(row.data));
  }

  async function listProblems(query = '') {
    const keyword = '%' + String(query).trim() + '%';
    return parseRows(database.prepare(`
      SELECT data FROM problems
      WHERE title LIKE ? OR subject LIKE ? OR unit LIKE ? OR data LIKE ?
      ORDER BY updated_at DESC
    `).all(keyword, keyword, keyword, keyword));
  }

  async function saveProblem(problem) {
    const now = new Date().toISOString();
    const current = problem.id ? problemById.get(problem.id) : undefined;
    const previous = current ? JSON.parse(current.data) : undefined;
    const next = {
      ...problem,
      id: problem.id || randomUUID(),
      createdAt: previous?.createdAt || now,
      updatedAt: now,
    };
    saveProblemStatement.run(next.id, next.title, next.subject, next.unit, next.updatedAt, JSON.stringify(next));
    return next;
  }

  async function deleteProblem(id) {
    const isReferenced = parseRows(database.prepare('SELECT data FROM test_papers').all())
      .some((test) => test.items.some((item) => item.problemId === id));
    if (isReferenced) {
      throw new Error('この問題を使っている保存済みテストがあるため削除できません。');
    }
    database.prepare('DELETE FROM problems WHERE id = ?').run(id);
  }

  async function listTests(query = '') {
    const keyword = '%' + String(query).trim() + '%';
    return parseRows(database.prepare(`
      SELECT data FROM test_papers
      WHERE name LIKE ? OR kind LIKE ? OR subject LIKE ? OR data LIKE ?
      ORDER BY updated_at DESC
    `).all(keyword, keyword, keyword, keyword));
  }

  async function saveTest(test) {
    const now = new Date().toISOString();
    const current = test.id ? testById.get(test.id) : undefined;
    const previous = current ? JSON.parse(current.data) : undefined;
    const next = {
      ...test,
      id: test.id || randomUUID(),
      kind: test.kind || '小テスト',
      subject: test.subject || '数学Ⅰ・A',
      createdAt: previous?.createdAt || now,
      updatedAt: now,
    };
    saveTestStatement.run(next.id, next.name, next.kind, next.subject, next.updatedAt, JSON.stringify(next));
    return next;
  }

  async function deleteTest(id) {
    database.prepare('DELETE FROM test_papers WHERE id = ?').run(id);
  }

  function seedDemoData() {
    if (database.prepare('SELECT 1 FROM problems LIMIT 1').get() || database.prepare('SELECT 1 FROM test_papers LIMIT 1').get()) return;
    const createdAt = '2026-07-28T07:10:00.000Z';
    const graphImage = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 120"><path d="M25 10V105H225M30 90H215" stroke="#657486" fill="none"/><path d="M48 22Q120 136 192 30" stroke="#4f806a" stroke-width="4" fill="none"/><circle cx="120" cy="96" r="4" fill="#4f806a"/><text x="130" y="111" fill="#36735f" font-size="14">頂点</text></svg>').toString('base64');
    const problems = [
      { id: 'demo-factorization', title: '因数分解の基本問題', subject: '数学Ⅰ・A', unit: '数と式', format: '記述', defaultPoints: 5, questionText: 'x² − 5x + 6 を因数分解しなさい。', answerText: '(x − 2)(x − 3)', explanation: '積が6、和が5となる2数を考えます。', createdAt, updatedAt: createdAt },
      { id: 'demo-proposition', title: '命題の真偽', subject: '数学Ⅰ・A', unit: '集合と命題', format: '記述', defaultPoints: 4, questionText: '「すべての偶数は2の倍数である」は真か偽か答えなさい。', answerText: '真', explanation: '偶数は2で割り切れる整数です。', createdAt, updatedAt: createdAt },
      { id: 'demo-quadratic', title: '2次関数のグラフ', subject: '数学Ⅰ・A', unit: '2次関数', format: '記述', defaultPoints: 6, questionText: '次のグラフの頂点の座標を答えなさい。', answerText: '(2, −1)', explanation: '放物線の最も低い点を読み取ります。', imageData: graphImage, createdAt, updatedAt: createdAt },
      { id: 'demo-triangle', title: '三角形の面積', subject: '数学Ⅰ・A', unit: '図形と計量', format: '記述', defaultPoints: 7, questionText: 'a = 5、b = 6、C = 60° のとき、△ABCの面積を求めなさい。', answerText: '15√3 / 2', explanation: '面積公式 1/2 ab sin C を用います。', createdAt, updatedAt: createdAt },
      { id: 'demo-counting', title: '場合の数：順列と組合せ', subject: '数学Ⅰ・A', unit: '場合の数', format: '記述', defaultPoints: 9, questionText: '5人から2人を選ぶ方法は何通りありますか。', answerText: '10通り', explanation: '5C2 = 10 です。', createdAt, updatedAt: createdAt },
    ];
    const tests = [
      { id: 'demo-test-quadratic', name: '2次関数 小テスト', kind: '小テスト', subject: '数学Ⅰ・A', items: [{ problemId: 'demo-factorization', points: 5, order: 1 }, { problemId: 'demo-proposition', points: 4, order: 2 }, { problemId: 'demo-quadratic', points: 8, order: 3 }, { problemId: 'demo-triangle', points: 8, order: 4 }], createdAt, updatedAt: '2026-08-01T09:30:00.000Z' },
      { id: 'demo-test-counting', name: '場合の数 確認テスト', kind: '定期テスト', subject: '数学Ⅰ・A', items: [{ problemId: 'demo-proposition', points: 4, order: 1 }, { problemId: 'demo-triangle', points: 7, order: 2 }, { problemId: 'demo-counting', points: 9, order: 3 }], createdAt, updatedAt: createdAt },
    ];
    for (const problem of problems) saveProblemStatement.run(problem.id, problem.title, problem.subject, problem.unit, problem.updatedAt, JSON.stringify(problem));
    for (const test of tests) saveTestStatement.run(test.id, test.name, test.kind, test.subject, test.updatedAt, JSON.stringify(test));
  }

  return { listProblems, saveProblem, deleteProblem, listTests, saveTest, deleteTest, seedDemoData };
}

module.exports = { createLocalStore };
