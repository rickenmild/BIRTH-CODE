import { NavLink, Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div className="app">
      <header className="topbar">
        <NavLink to="/" className="logo" aria-label="BIRTH CODE HOME">BIRTH<span>CODE</span></NavLink>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <nav className="tabbar" aria-label="メインメニュー">
        <NavLink to="/" end>HOME</NavLink>
        <NavLink to="/profile">診断</NavLink>
        <NavLink to="/collection">COLLECTION</NavLink>
        <NavLink to="/settings">SETTINGS</NavLink>
      </nav>
    </div>
  );
}

export function ResultTabs({ id, current }: { id: string; current: 'result' | 'board' | 'pedal' }) {
  const tabs: Array<[typeof current, string, string]> = [
    ['result', '診断結果', `/result/${id}`],
    ['board', 'EFFECT BOARD', `/board/${id}`],
    ['pedal', 'ORIGINAL PEDAL', `/pedal/${id}`],
  ];
  return (
    <div className="subtabs" role="tablist">
      {tabs.map(([k, label, to]) => (
        <NavLink key={k} to={to} replace role="tab" aria-selected={k === current} className={k === current ? 'on' : ''}>
          {label}
        </NavLink>
      ))}
    </div>
  );
}
