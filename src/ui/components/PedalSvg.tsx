import { useId } from 'react';
import type { BodyShape, EyeStyle, VisualSpec } from '../../types';

const SHAPES: Record<BodyShape, { x: number; y: number; w: number; h: number; r: number }> = {
  box: { x: 40, y: 38, w: 120, h: 150, r: 14 },
  wide: { x: 26, y: 50, w: 148, h: 136, r: 10 },
  tall: { x: 48, y: 30, w: 104, h: 160, r: 10 },
  round: { x: 38, y: 40, w: 124, h: 148, r: 46 },
};

const INK = '#2b2118';
const LIMB = '#e9dfcf';

function Eyes({ style, cx, cy }: { style: EyeStyle; cx: number; cy: number }) {
  const l = cx - 24;
  const r = cx + 24;
  switch (style) {
    case 'sleepy':
      return (
        <g stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none">
          <path d={`M${l - 12} ${cy} Q${l} ${cy + 10} ${l + 12} ${cy}`} />
          <path d={`M${r - 12} ${cy} Q${r} ${cy + 10} ${r + 12} ${cy}`} />
        </g>
      );
    case 'happy':
      return (
        <g stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none">
          <path d={`M${l - 12} ${cy + 4} Q${l} ${cy - 12} ${l + 12} ${cy + 4}`} />
          <path d={`M${r - 12} ${cy + 4} Q${r} ${cy - 12} ${r + 12} ${cy + 4}`} />
        </g>
      );
    case 'angry':
      return (
        <g>
          <ellipse cx={l} cy={cy} rx="11" ry="12" fill="#fff" stroke={INK} strokeWidth="3.5" />
          <ellipse cx={r} cy={cy} rx="11" ry="12" fill="#fff" stroke={INK} strokeWidth="3.5" />
          <circle cx={l + 2} cy={cy + 2} r="4.5" fill={INK} />
          <circle cx={r - 2} cy={cy + 2} r="4.5" fill={INK} />
          <path d={`M${l - 14} ${cy - 18} L${l + 12} ${cy - 9}`} stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
          <path d={`M${r + 14} ${cy - 18} L${r - 12} ${cy - 9}`} stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
        </g>
      );
    case 'wide':
      return (
        <g>
          <circle cx={l} cy={cy} r="15" fill="#fff" stroke={INK} strokeWidth="3.5" />
          <circle cx={r} cy={cy} r="15" fill="#fff" stroke={INK} strokeWidth="3.5" />
          <circle cx={l} cy={cy} r="6" fill={INK} />
          <circle cx={r} cy={cy} r="6" fill={INK} />
          <circle cx={l + 2} cy={cy - 2} r="2" fill="#fff" />
          <circle cx={r + 2} cy={cy - 2} r="2" fill="#fff" />
        </g>
      );
    default:
      return (
        <g>
          <ellipse cx={l} cy={cy} rx="11" ry="13" fill="#fff" stroke={INK} strokeWidth="3.5" />
          <ellipse cx={r} cy={cy} rx="11" ry="13" fill="#fff" stroke={INK} strokeWidth="3.5" />
          <circle cx={l + 2} cy={cy + 2} r="5" fill={INK} />
          <circle cx={r + 2} cy={cy + 2} r="5" fill={INK} />
        </g>
      );
  }
}

function Knob({ x, y, style, fill }: { x: number; y: number; style: VisualSpec['knobStyle']; fill: string }) {
  if (style === 'hex') {
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i + Math.PI / 6;
      return `${x + 8.5 * Math.cos(a)},${y + 8.5 * Math.sin(a)}`;
    }).join(' ');
    return (
      <g>
        <polygon points={pts} fill={fill} stroke={INK} strokeWidth="2.5" />
        <line x1={x} y1={y} x2={x} y2={y - 6} stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
      </g>
    );
  }
  return (
    <g>
      <circle cx={x} cy={y} r="8.5" fill={fill} stroke={INK} strokeWidth="2.5" />
      {style === 'pointer' ? (
        <path d={`M${x} ${y - 7} L${x + 3} ${y + 1} L${x - 3} ${y + 1} Z`} fill={INK} />
      ) : (
        <line x1={x} y1={y} x2={x + 4} y2={y - 5} stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
      )}
    </g>
  );
}

export interface PedalSvgProps {
  spec: VisualSpec;
  size?: number;
  title?: string;
}

/** エフェクター筐体そのものを擬人化したキャラクターを、パラメータからSVGで描く。 */
export function PedalSvg({ spec, size = 160, title }: PedalSvgProps) {
  const uid = useId().replace(/:/g, '');
  const s = SHAPES[spec.body];
  const cx = s.x + s.w / 2;
  const clip = `clip-${uid}`;
  const legH = spec.limbs === 'long' ? 34 : 22;
  const armLen = spec.limbs === 'long' ? 34 : 22;
  const knobY = s.y + 24;
  const knobGap = Math.min(30, (s.w - 40) / Math.max(spec.knobs, 1));
  const knobStart = cx - (knobGap * (spec.knobs - 1)) / 2;
  const eyeY = s.y + s.h * 0.5;
  const swY = s.y + s.h - 24;

  return (
    <svg viewBox="0 0 200 240" width={size} height={(size * 240) / 200} role="img" aria-label={title ?? 'エフェクターキャラクター'}>
      <defs>
        <clipPath id={clip}>
          <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r} />
        </clipPath>
      </defs>
      {/* 影 */}
      <ellipse cx={cx} cy={s.y + s.h + legH + 6} rx={s.w / 2 - 6} ry="6" fill="#000" opacity="0.28" />
      {/* 足（暗い背景でも見えるよう、明るい線を濃い縁取りで挟む） */}
      {[-22, 22].map((dx) => (
        <g key={`leg${dx}`} strokeLinecap="round">
          <line x1={cx + dx} y1={s.y + s.h} x2={cx + dx} y2={s.y + s.h + legH} stroke={INK} strokeWidth="9" />
          <line x1={cx + dx} y1={s.y + s.h} x2={cx + dx} y2={s.y + s.h + legH} stroke={LIMB} strokeWidth="4" />
        </g>
      ))}
      <g fill={INK}>
        <ellipse cx={cx - 24} cy={s.y + s.h + legH + 2} rx="11" ry="5.5" />
        <ellipse cx={cx + 24} cy={s.y + s.h + legH + 2} rx="11" ry="5.5" />
      </g>
      {/* 手 */}
      {[-1, 1].map((dir) => {
        const x0 = dir < 0 ? s.x : s.x + s.w;
        const y0 = s.y + s.h * 0.55;
        const d = `M${x0} ${y0} q${dir * armLen * 0.6} ${armLen * 0.2} ${dir * armLen * 0.7} ${armLen * 0.9}`;
        return (
          <g key={`arm${dir}`} fill="none" strokeLinecap="round">
            <path d={d} stroke={INK} strokeWidth="9" />
            <path d={d} stroke={LIMB} strokeWidth="4" />
            <circle cx={x0 + dir * armLen * 0.7} cy={y0 + armLen * 0.9} r="6.5" fill="#fff" stroke={INK} strokeWidth="3" />
          </g>
        );
      })}
      {/* 筐体 */}
      <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r} fill={spec.color} stroke={INK} strokeWidth="5" />
      {/* 模様 */}
      <g clipPath={`url(#${clip})`} opacity="0.55">
        {spec.pattern === 'stripe' &&
          Array.from({ length: 9 }, (_, i) => (
            <rect key={i} x={s.x - 20 + i * 22} y={s.y - 20} width="9" height={s.h + 40} fill={spec.color2} transform={`rotate(20 ${cx} ${s.y + s.h / 2})`} />
          ))}
        {spec.pattern === 'dots' &&
          Array.from({ length: 20 }, (_, i) => (
            <circle key={i} cx={s.x + 14 + (i % 5) * (s.w / 4.5)} cy={s.y + s.h * 0.32 + Math.floor(i / 5) * 24 + ((i % 5) % 2) * 8} r="4" fill={spec.color2} />
          ))}
        {spec.pattern === 'zig' && (
          <polyline
            fill="none"
            stroke={spec.color2}
            strokeWidth="6"
            points={Array.from({ length: 11 }, (_, i) => `${s.x + i * (s.w / 10)},${s.y + s.h * 0.72 + (i % 2) * 14}`).join(' ')}
          />
        )}
        {spec.pattern === 'flame' &&
          Array.from({ length: 5 }, (_, i) => (
            <path key={i} d={`M${s.x + i * (s.w / 5)} ${s.y + s.h} q${s.w / 20} -${30 + (i % 2) * 16} ${s.w / 10} -${14 + (i % 3) * 8} q${s.w / 20} -${14 + (i % 2) * 6} ${s.w / 10} ${14 + (i % 3) * 8} z`} fill={spec.color2} />
          ))}
      </g>
      {/* 上パネルの帯 */}
      <rect x={s.x + 5} y={s.y + 5} width={s.w - 10} height="38" rx={Math.max(s.r - 4, 4)} fill={spec.color2} opacity="0.35" />
      {/* ノブ */}
      {Array.from({ length: spec.knobs }, (_, i) => (
        <Knob key={i} x={knobStart + i * knobGap} y={knobY} style={spec.knobStyle} fill="#f2ede4" />
      ))}
      {/* LED */}
      <circle cx={s.x + s.w - 16} cy={s.y + 14} r="5.5" fill={spec.led} stroke={INK} strokeWidth="2" />
      <circle cx={s.x + s.w - 17.5} cy={s.y + 12.5} r="1.6" fill="#fff" opacity="0.8" />
      {/* 顔 */}
      <Eyes style={spec.eyes} cx={cx} cy={eyeY} />
      <path
        d={spec.eyes === 'angry' ? `M${cx - 9} ${eyeY + 30} Q${cx} ${eyeY + 22} ${cx + 9} ${eyeY + 30}` : `M${cx - 9} ${eyeY + 24} Q${cx} ${eyeY + 34} ${cx + 9} ${eyeY + 24}`}
        fill="none"
        stroke={INK}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* フットスイッチ */}
      {Array.from({ length: spec.switches }, (_, i) => {
        const x = spec.switches === 1 ? cx : cx + (i === 0 ? -20 : 20);
        return (
          <g key={i}>
            <circle cx={x} cy={swY} r="11" fill="#cfcfcf" stroke={INK} strokeWidth="3" />
            <circle cx={x} cy={swY} r="5" fill="#8c8c8c" />
          </g>
        );
      })}
      {/* 入出力端子（左右） */}
      <rect x={s.x - 4} y={s.y + 26} width="8" height="12" rx="2" fill="#9a9a9a" stroke={INK} strokeWidth="2" />
      <rect x={s.x + s.w - 4} y={s.y + 26} width="8" height="12" rx="2" fill="#9a9a9a" stroke={INK} strokeWidth="2" />
    </svg>
  );
}

/** 素材欠損・未対応時のプレースホルダー（画面全体を止めない） */
export function PedalPlaceholder({ size = 120, label = '未対応' }: { size?: number; label?: string }) {
  return (
    <div className="placeholder" style={{ width: size, height: (size * 240) / 200 }} role="img" aria-label={label}>
      <span>？</span>
      <small>{label}</small>
    </div>
  );
}
