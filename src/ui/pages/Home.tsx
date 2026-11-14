import { Link } from 'react-router-dom';
import { CHARACTERS } from '../../characters/definitions';
import { PedalSvg } from '../components/PedalSvg';
import { Disclaimer } from '../components/common';

export function HomePage() {
  const hero = CHARACTERS.slice(0, 3);
  return (
    <div className="stack">
      <section className="hero">
        <div className="hero-row">
          {hero.map((c) => <PedalSvg key={c.characterCode} spec={c.visual} size={88} title={c.name} />)}
        </div>
        <h1>生年月日から、<br />自分だけのペダルを作る。</h1>
        <p className="muted">占術の結果を、エフェクターのキャラクターで表現する占い遊びアプリ。</p>
        <Link to="/profile" className="btn primary big-btn" data-testid="start">診断をはじめる</Link>
      </section>

      <section className="stack">
        <article className="card feature">
          <h3>MY EFFECT BOARD</h3>
          <p>占術ごとの結果を、エフェクターボードに並べて眺める。</p>
        </article>
        <article className="card feature">
          <h3>MY ORIGINAL PEDAL</h3>
          <p>複数の結果を合わせて、あなた専用のペダルを1体つくる。</p>
        </article>
        <article className="card feature">
          <h3>PEDAL COLLECTION</h3>
          <p>家族や友人のペダルも集めて、コレクションを完成させる。</p>
          <Link to="/collection" className="btn ghost">コレクションを見る</Link>
        </article>
      </section>

      <p className="muted small">
        データはこの端末のブラウザ内にだけ保存され、外部へ送信されません。他の人の生年月日を登録するときは、ご本人の了解を得てください。
      </p>
      <p className="muted small">※ 現在は開発版（MVP）です。占術の結果は「仮」と表示されるサンプルロジックで、確定結果ではありません。</p>
      <Disclaimer />
    </div>
  );
}
