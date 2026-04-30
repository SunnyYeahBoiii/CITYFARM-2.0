import type { ReactNode } from "react";
import { ScrollReveal } from "./scroll-reveal";

type FeatureCardProps = {
  eyebrow: string;
  title: string;
  body: string;
  note: string;
  children: ReactNode;
};

function FeatureCard({ eyebrow, title, body, note, children }: FeatureCardProps) {
  return (
    <article className="rounded-[2rem] border border-[#172516]/10 bg-white/70 p-5 shadow-[0_18px_54px_rgba(23,37,22,0.08)] transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_24px_64px_rgba(23,37,22,0.12)]">
      <div className="overflow-hidden rounded-[1.5rem] border border-[#172516]/10 bg-[linear-gradient(180deg,#fffdf7,#f4ecda)] p-3">
        {children}
      </div>
      <div className="mt-5">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#6f8f45]">{eyebrow}</p>
        <h3 className="mt-3 text-2xl font-black tracking-[-0.04em]">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-[#172516]/68">{body}</p>
        {/* <p className="mt-4 rounded-2xl bg-[#f5f0df] px-4 py-3 text-sm font-semibold leading-6 text-[#30442a]">{note}</p> */}
      </div>
    </article>
  );
}

function SpaceIntelligenceDemo() {
  return (
    <div className="relative h-[19rem] rounded-[1.2rem] bg-[linear-gradient(145deg,#21361f,#4d7440_52%,#f0b14e)]">
      <svg
        viewBox="0 0 360 240"
        className="h-full w-full"
        role="img"
        aria-label="Minh họa quét một góc trống trong nhà rồi thêm cây vào vị trí đó"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="cfScanWallGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#123f2c" />
            <stop offset="1" stopColor="#0b2c20" />
          </linearGradient>
          <linearGradient id="cfScanFloorGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#f2d99b" />
            <stop offset="1" stopColor="#dcae5d" />
          </linearGradient>
          <radialGradient id="cfScanGlow" cx="50%" cy="50%" r="55%">
            <stop offset="0" stopColor="#ffe76a" stopOpacity=".75" />
            <stop offset="1" stopColor="#a8e66c" stopOpacity="0" />
          </radialGradient>
          <style>
            {`svg{font-family:"Be Vietnam Pro","Segoe UI",sans-serif}
            .cfText{fill:#fff6d8;font-weight:700}
            .cfSmall{font-size:6.2px;font-weight:600}
            .cfScan{animation:cfScan 4s infinite ease-in-out}
            .cfPlant{transform-origin:178px 166px;animation:cfPlant 4s infinite ease-in-out}
            .cfBadge{animation:cfBadge 4s infinite ease-in-out}
            .cfEmpty{animation:cfEmpty 4s infinite ease-in-out}
            .cfPulse{animation:cfPulse 4s infinite ease-in-out}
            @keyframes cfEmpty{0%,24%{opacity:1;stroke-dashoffset:0}55%,100%{opacity:.25;stroke-dashoffset:-22}}
            @keyframes cfScan{0%,24%{opacity:0;transform:translateX(-22px)}30%{opacity:1}60%{opacity:1;transform:translateX(56px)}66%,100%{opacity:0;transform:translateX(72px)}}
            @keyframes cfPlant{0%,59%{opacity:0;transform:scale(.62) translateY(18px)}70%{opacity:1;transform:scale(1.05) translateY(-2px)}85%,100%{opacity:1;transform:scale(1) translateY(0)}}
            @keyframes cfBadge{0%,58%{opacity:0;transform:translateY(7px)}72%,100%{opacity:1;transform:translateY(0)}}
            @keyframes cfPulse{0%,25%{opacity:.82}45%{opacity:1}70%,100%{opacity:.32}}`}
          </style>
        </defs>

        <rect width="360" height="240" rx="16" fill="#08261c" />
        <path d="M0 0h186v148H0z" fill="url(#cfScanWallGrad)" />
        <path d="M186 0h174v148H186z" fill="#0a3022" />
        <path d="M185 0v148" stroke="#071f17" strokeWidth="2" />
        <path d="M0 148h360v92H0z" fill="url(#cfScanFloorGrad)" />
        <path d="M0 148h360" stroke="#fff0bd" strokeWidth="5" />
        <path d="M42 164h270M30 184h290M22 205h304" stroke="#c78b3f" strokeOpacity=".3" strokeWidth="1" />
        <path d="M70 28h34v50H70z" fill="#d8a958" />
        <path d="M75 33h24v40H75z" fill="#fff1c8" />
        <path
          d="M88 45c-8 9-8 17-9 23M88 52c8-6 10-12 11-18M85 57c9-1 14-5 17-11M82 63c8 0 13-2 17-7"
          fill="none"
          stroke="#2d6841"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="M16 122h74v50H16z" fill="#9a662e" />
        <path d="M20 128h66v38H20z" fill="#c88c45" />
        <path d="M25 132v29M35 132v29M45 132v29M55 132v29M65 132v29M75 132v29" stroke="#865421" strokeOpacity=".55" />
        <rect x="18" y="107" width="72" height="16" rx="3" fill="#e8bd72" />
        <rect x="25" y="98" width="28" height="5" rx="1" fill="#c7d990" />
        <rect x="23" y="104" width="33" height="4" rx="1" fill="#f4e5bd" />
        <path d="M62 95c5 1 8 6 4 11-5 1-10-1-11-5 1-4 3-6 7-6z" fill="#f6d487" />
        <path d="M58 93h7v12h-7z" fill="#fff2c8" />
        <path d="M130 153l48-24 61 24-48 27z" fill="#071f17" opacity=".16" />

        <g className="cfEmpty">
          <path
            d="M122 75l55-14 58 14v77l-44 25-69-25z"
            fill="#fff4a8"
            fillOpacity=".04"
            stroke="#ffe66d"
            strokeWidth="1.7"
            strokeDasharray="6 5"
          />
          <path d="M138 85h76M138 100h76M138 115h76M138 130h76M138 145h76M151 78v82M166 75v91M181 72v97M196 76v86M211 80v75" stroke="#ffe66d" strokeOpacity=".12" />
          <text x="144" y="126" className="cfText cfSmall" opacity=".75">
            Góc trống
          </text>
        </g>

        <g className="cfScan">
          <ellipse cx="160" cy="122" rx="36" ry="48" fill="url(#cfScanGlow)" />
          <rect x="156" y="64" width="3" height="98" rx="2" fill="#fff47a" />
          <circle cx="157.5" cy="64" r="3" fill="#fff8bd" />
          <circle cx="157.5" cy="162" r="3" fill="#fff8bd" />
        </g>

        <g className="cfPlant">
          <ellipse cx="178" cy="185" rx="28" ry="6" fill="#051b14" opacity=".28" />
          <path d="M154 153h50l-5 33c-1 7-6 10-20 10s-25-3-26-10z" fill="#f6dfad" />
          <ellipse cx="179" cy="153" rx="25" ry="8" fill="#fff0c9" />
          <ellipse cx="179" cy="153" rx="19" ry="5" fill="#2b2517" />
          <path d="M159 194h40" stroke="#c89750" strokeWidth="3" strokeLinecap="round" />
          <path
            d="M178 151c-1-23-2-43-2-55M178 150c-13-16-20-30-27-46M180 150c12-16 22-30 31-47M175 147c-17-7-29-14-39-28M183 146c19-8 31-16 43-29"
            stroke="#3b8d42"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <g fill="#7bc65a" stroke="#437c37" strokeWidth=".8">
            <ellipse cx="176" cy="91" rx="8" ry="14" transform="rotate(12 176 91)" />
            <ellipse cx="160" cy="107" rx="8" ry="13" transform="rotate(-34 160 107)" />
            <ellipse cx="195" cy="106" rx="8" ry="14" transform="rotate(34 195 106)" />
            <ellipse cx="145" cy="121" rx="8" ry="13" transform="rotate(-55 145 121)" />
            <ellipse cx="213" cy="119" rx="8" ry="13" transform="rotate(55 213 119)" />
            <ellipse cx="164" cy="130" rx="8" ry="13" transform="rotate(-22 164 130)" />
            <ellipse cx="194" cy="132" rx="8" ry="13" transform="rotate(24 194 132)" />
            <ellipse cx="179" cy="119" rx="9" ry="15" transform="rotate(4 179 119)" />
          </g>
        </g>

        <g className="cfBadge">
          <rect x="222" y="58" width="128" height="114" rx="16" fill="#0d3a29" stroke="#ffe66d" strokeWidth="1.2" />
          <circle cx="246" cy="58" r="16" fill="#ffd96a" stroke="#fff1a8" strokeWidth="2" />
          <text x="239" y="63" fill="#103623" fontSize="14" fontWeight="900">
            AI
          </text>
          <text x="238" y="86" className="cfText" fontSize="8.5">
            Phù hợp nhất:
          </text>
          <text x="238" y="111" fill="#ffd96a" fontSize="16" fontWeight="900">
            Húng lủi
          </text>

          <g>
            <circle cx="240" cy="131" r="8" fill="#79b85a" opacity=".9" />
            <path d="M237 132c6-2 7-7 8-10-6 2-9 5-8 10z" fill="#fff7cf" />
            <text x="253" y="127" fill="#fff6d8" fontSize="6.2">
              <tspan x="253" dy="0">Thanh lọc</tspan>
              <tspan x="253" dy="8.2">không khí</tspan>
            </text>
          </g>

          <g>
            <circle cx="240" cy="153" r="8" fill="#79b85a" opacity=".9" />
            <path d="M240 148v10M235 153h10M237 150l6 6M243 150l-6 6" stroke="#fff7cf" strokeWidth="1" />
            <text x="253" y="149" fill="#fff6d8" fontSize="6.2">
              <tspan x="253" dy="0">Ưa ánh sáng</tspan>
              <tspan x="253" dy="8.2">nhẹ</tspan>
            </text>
          </g>
        </g>

        <g className="cfPulse">
          <rect x="20" y="203" width="165" height="24" rx="12" fill="#0c3526" stroke="#d9d467" strokeOpacity=".7" />
          <text x="32" y="219" fill="#fff6d8" fontSize="6.2">
            A. Góc trống
          </text>
          <text x="88" y="219" fill="#ffe66d" fontSize="6.2" fontWeight="800">
            B. AI quét
          </text>
          <text x="138" y="219" fill="#fff6d8" fontSize="6.2">
            C. Đặt cây
          </text>
        </g>
      </svg>
    </div>
  );
}

function GuidedCultivationDemo() {
  return (
    <div className="relative h-[19rem] rounded-[1.2rem] bg-[linear-gradient(145deg,#102116,#234f2b_44%,#6f8f45)]">
      <svg
        viewBox="0 0 360 240"
        className="h-full w-full"
        role="img"
        aria-label="Minh họa kích hoạt bộ kit trồng cây, đồng bộ dữ liệu sang ứng dụng và theo dõi tác vụ chăm sóc cây"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="kitBgGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#143823" />
            <stop offset="1" stopColor="#081f17" />
          </linearGradient>
          <linearGradient id="kitCardGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff3da" />
            <stop offset="1" stopColor="#efd49b" />
          </linearGradient>
          <linearGradient id="kitPhoneGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1b321e" />
            <stop offset="1" stopColor="#0d1f13" />
          </linearGradient>
          <style>
            {`
              svg{font-family:"Be Vietnam Pro","Segoe UI",sans-serif}
              .kitFloat{animation:kitFloat 4s infinite ease-in-out}
              .kitFloatSlow{animation:kitFloatSlow 4s infinite ease-in-out}
              .kitFlow{stroke-dasharray:8 9;animation:kitFlow 4s infinite linear}
              .kitPulse{transform-origin:182px 112px;animation:kitPulse 4s infinite ease-in-out}
              .kitPlant{transform-origin:246px 136px;animation:kitPlant 4s infinite ease-in-out}
              .kitLeafA{transform-origin:246px 128px;animation:kitLeafA 4s infinite ease-in-out}
              .kitLeafB{transform-origin:246px 118px;animation:kitLeafB 4s infinite ease-in-out}
              .kitProgress{animation:kitProgress 4s infinite ease-in-out}
              .kitCheck{transform-origin:288px 104px;animation:kitCheck 4s infinite ease-in-out}
              .kitTaskA{animation:kitTaskA 4s infinite ease-in-out}
              .kitTaskB{animation:kitTaskB 4s infinite ease-in-out}
              @keyframes kitFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
              @keyframes kitFloatSlow{0%,100%{transform:translateY(0)}50%{transform:translateY(3px)}}
              @keyframes kitFlow{0%{stroke-dashoffset:0;opacity:.35}30%{opacity:1}100%{stroke-dashoffset:-34;opacity:.35}}
              @keyframes kitPulse{0%,20%{opacity:.35;transform:scale(.82)}45%,70%{opacity:1;transform:scale(1)}100%{opacity:.35;transform:scale(.82)}}
              @keyframes kitPlant{0%,28%{opacity:.75;transform:scale(.86)}55%,100%{opacity:1;transform:scale(1)}}
              @keyframes kitLeafA{0%,28%{transform:scale(.72) rotate(-4deg);opacity:.65}60%,100%{transform:scale(1) rotate(0deg);opacity:1}}
              @keyframes kitLeafB{0%,34%{transform:scale(.68) rotate(5deg);opacity:.55}66%,100%{transform:scale(1) rotate(0deg);opacity:1}}
              @keyframes kitProgress{0%,25%{width:22px}60%,100%{width:58px}}
              @keyframes kitCheck{0%,44%{opacity:0;transform:scale(.65)}58%{opacity:1;transform:scale(1.08)}72%,100%{opacity:1;transform:scale(1)}}
              @keyframes kitTaskA{0%,32%{opacity:0;transform:translateY(8px)}46%,100%{opacity:1;transform:translateY(0)}}
              @keyframes kitTaskB{0%,48%{opacity:0;transform:translateY(8px)}62%,100%{opacity:1;transform:translateY(0)}}
            `}
          </style>
        </defs>

        <rect width="360" height="240" rx="18" fill="url(#kitBgGrad)" />
        <path d="M0 154h360v86H0z" fill="#e9be66" />
        <path d="M0 154h360" stroke="#fff0bd" strokeWidth="5" />
        <path d="M42 178h276M58 205h244" stroke="#b8843b" strokeOpacity=".28" />

        <g className="kitFloat">
          <rect x="28" y="91" width="98" height="82" rx="16" fill="url(#kitCardGrad)" />
          <rect x="28" y="82" width="98" height="25" rx="12.5" fill="#f0b14e" />
          <text x="48" y="98" fill="#203119" fontSize="8.4" fontWeight="900" letterSpacing=".5">
            Bộ kit trồng
          </text>
          <rect x="51" y="119" width="52" height="38" rx="9" fill="#203119" />
          <rect x="59" y="126" width="10" height="10" rx="1" fill="#f8f1df" />
          <rect x="74" y="126" width="7" height="7" rx="1" fill="#f8f1df" />
          <rect x="87" y="126" width="9" height="9" rx="1" fill="#f8f1df" />
          <rect x="59" y="141" width="8" height="8" rx="1" fill="#f8f1df" />
          <rect x="73" y="139" width="9" height="12" rx="1" fill="#f8f1df" />
          <rect x="87" y="141" width="9" height="8" rx="1" fill="#f8f1df" />
          <text x="49" y="168" fill="#36522d" fontSize="6.6" fontWeight="700">
            Quét mã để kích hoạt
          </text>
        </g>

        <path d="M128 125 C151 125, 158 110, 184 110" stroke="#cde89a" strokeWidth="4" strokeLinecap="round" fill="none" className="kitFlow" />
        <circle cx="184" cy="110" r="8" fill="#cde89a" className="kitPulse" />

        <g>
          <rect x="194" y="38" width="132" height="170" rx="28" fill="url(#kitPhoneGrad)" stroke="#f8f1df" strokeOpacity=".22" strokeWidth="3" />
          <rect x="209" y="55" width="102" height="136" rx="20" fill="#f8f1df" />
          <text x="224" y="76" fill="#2d4f29" fontSize="9.2" fontWeight="900" letterSpacing=".7">
            Vườn của tôi
          </text>
          <text x="225" y="91" fill="#6f8f45" fontSize="6.5" fontWeight="700">
            Húng lủi · Ngày 12
          </text>

          <g className="kitPlant">
            <rect x="232" y="134" width="28" height="20" rx="8" fill="#6a4421" />
            <path d="M246 136v-18" stroke="#2d4f29" strokeWidth="4" strokeLinecap="round" />
            <path className="kitLeafA" d="M246 128c-9-6-8-17 0-21 8 4 9 15 0 21Z" fill="#8ac75f" />
            <path className="kitLeafB" d="M246 118c10-7 12-18 4-26-10 3-15 13-4 26Z" fill="#cde89a" />
          </g>

          <g className="kitTaskA">
            <rect x="221" y="96" width="68" height="22" rx="11" fill="#ffffff" />
            <circle cx="233" cy="107" r="5" fill="#69a5e1" />
            <text x="244" y="110" fill="#203119" fontSize="7.6" fontWeight="800">
              Tưới nước
            </text>
          </g>

          <g className="kitTaskB">
            <rect x="246" y="122" width="56" height="22" rx="11" fill="#ffffff" />
            <circle cx="258" cy="133" r="5" fill="#f0b14e" />
            <text x="269" y="136" fill="#203119" fontSize="7.6" fontWeight="800">
              Cắt tỉa
            </text>
          </g>

          <rect x="221" y="158" width="78" height="10" rx="5" fill="#dae8bd" />
          <rect x="221" y="158" height="10" rx="5" fill="#6f8f45" className="kitProgress" />
          <text x="221" y="181" fill="#6f8f45" fontSize="6.4" fontWeight="700">
            Tiến độ chăm sóc
          </text>
        </g>

        <g className="kitCheck">
          <circle cx="289" cy="103" r="16" fill="#cde89a" />
          <path d="m281 103 5 5 10-12" stroke="#203119" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>

        <g className="kitFloatSlow">
          <rect x="42" y="196" width="160" height="25" rx="12.5" fill="#0c3526" stroke="#d9d467" strokeOpacity=".55" />
          <text x="56" y="212" fill="#fff6d8" fontSize="6.4" fontWeight="700">
            1. Kích hoạt
          </text>
          <text x="105" y="212" fill="#ffe66d" fontSize="6.4" fontWeight="900">
            2. Theo dõi
          </text>
          <text x="153" y="212" fill="#fff6d8" fontSize="6.4" fontWeight="700">
            3. Chăm sóc
          </text>
        </g>
      </svg>
    </div>
  );
}

function TrustedMarketDemo() {
  return (
    <div className="relative h-[19rem] rounded-[1.2rem] bg-[linear-gradient(145deg,#201810,#30442a_40%,#d9a55d)]">
      <svg
        viewBox="0 0 360 240"
        className="h-full w-full"
        role="img"
        aria-label="Minh họa chợ cây đã xác thực với nhật ký trồng, gian hàng xác minh và trò chuyện giữa người mua với người bán"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="marketBgGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#123823" />
            <stop offset="1" stopColor="#071f17" />
          </linearGradient>
          <linearGradient id="marketCardGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff6e3" />
            <stop offset="1" stopColor="#f1dcae" />
          </linearGradient>
          <style>
            {`
              svg{font-family:"Be Vietnam Pro","Segoe UI",sans-serif}
              .marketLog{animation:marketFloat 4s infinite ease-in-out}
              .marketStore{animation:marketFloatSoft 4s infinite ease-in-out}
              .marketVerify{transform-origin:164px 74px;animation:marketPop 4s infinite ease-in-out}
              .marketFlow{stroke-dasharray:7 8;animation:marketFlow 4s infinite linear}
              .marketDotA,.marketDotB,.marketDotC{transform-box:fill-box;transform-origin:center;animation:marketPulse 4s infinite ease-in-out}
              .marketDotB{animation-delay:220ms}
              .marketDotC{animation-delay:440ms}
              .marketChatA{animation:marketChatA 4s infinite ease-in-out}
              .marketChatB{animation:marketChatB 4s infinite ease-in-out}
              @keyframes marketFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
              @keyframes marketFloatSoft{0%,100%{transform:translateY(0)}50%{transform:translateY(3px)}}
              @keyframes marketFlow{0%{stroke-dashoffset:0;opacity:.45}50%{opacity:1}100%{stroke-dashoffset:-32;opacity:.45}}
              @keyframes marketPulse{0%,100%{transform:scale(.9);opacity:.75}50%{transform:scale(1.08);opacity:1}}
              @keyframes marketPop{0%,28%{opacity:0;transform:scale(.72)}44%{opacity:1;transform:scale(1.08)}60%,100%{opacity:1;transform:scale(1)}}
              @keyframes marketChatA{0%,46%{opacity:0;transform:translateY(8px)}58%,100%{opacity:1;transform:translateY(0)}}
              @keyframes marketChatB{0%,58%{opacity:0;transform:translateY(8px)}72%,100%{opacity:1;transform:translateY(0)}}
            `}
          </style>
        </defs>

        <rect width="360" height="240" rx="18" fill="url(#marketBgGrad)" />
        <path d="M0 158h360v82H0z" fill="#e8bd66" />
        <path d="M0 158h360" stroke="#fff0bd" strokeWidth="5" />
        <path d="M38 183h284M58 210h244" stroke="#9c6f35" strokeOpacity=".22" />

        <g className="marketLog">
          <rect x="28" y="34" width="122" height="170" rx="22" fill="url(#marketCardGrad)" />
          <text x="45" y="58" fill="#203119" fontSize="9.2" fontWeight="900" letterSpacing=".7">
            Nhật ký trồng
          </text>
          <path d="M62 82v78" stroke="#6f8f45" strokeWidth="4" strokeLinecap="round" className="marketFlow" />
          <circle cx="62" cy="82" r="7" fill="#b8dc76" className="marketDotA" />
          <circle cx="62" cy="121" r="7" fill="#b8dc76" className="marketDotB" />
          <circle cx="62" cy="160" r="7" fill="#b8dc76" className="marketDotC" />
          <rect x="78" y="70" width="56" height="24" rx="12" fill="#eff5de" />
          <rect x="78" y="109" width="56" height="24" rx="12" fill="#eff5de" />
          <rect x="78" y="148" width="56" height="24" rx="12" fill="#eff5de" />
          <text x="91" y="85" fill="#203119" fontSize="8.5" fontWeight="800">
            Ngày 04
          </text>
          <text x="91" y="124" fill="#203119" fontSize="8.5" fontWeight="800">
            Ngày 18
          </text>
          <text x="91" y="163" fill="#203119" fontSize="8.5" fontWeight="800">
            Ngày 31
          </text>
          <text x="46" y="190" fill="#6f8f45" fontSize="6.4" fontWeight="800">
            Dữ liệu chăm sóc rõ ràng
          </text>
        </g>

        <g className="marketVerify">
          <circle cx="164" cy="74" r="18" fill="#f0b14e" />
          <path d="m155 74 6 6 12-14" stroke="#203119" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>

        <path d="M150 82 C168 82, 171 80, 186 78" stroke="#cde89a" strokeWidth="3" strokeLinecap="round" fill="none" className="marketFlow" />

        <g className="marketStore">
          <rect x="184" y="48" width="148" height="96" rx="20" fill="url(#marketCardGrad)" />
          <text x="201" y="72" fill="#203119" fontSize="8.8" fontWeight="900" letterSpacing=".7">
            Gian hàng xác thực
          </text>
          <text x="201" y="96" fill="#203119" fontSize="13.5" fontWeight="900">
            <tspan x="201" dy="0">Bó húng lủi</tspan>
            <tspan x="201" dy="16">sân thượng</tspan>
          </text>
          <rect x="202" y="120" width="62" height="12" rx="6" fill="#cde89a" />
          <text x="213" y="128.5" fill="#203119" fontSize="6.2" fontWeight="800">
            Đã xác minh
          </text>
          <rect x="270" y="120" width="44" height="12" rx="6" fill="#f5e1bf" />
          <text x="280" y="128.5" fill="#203119" fontSize="6.2" fontWeight="800">
            Tươi
          </text>
          <text x="202" y="140" fill="#30442a" fontSize="7.4" fontWeight="800">
            Có nhật ký xác minh
          </text>
        </g>

        <g className="marketChatA">
          <rect x="190" y="158" width="116" height="30" rx="15" fill="#ffffff" />
          <text x="205" y="176" fill="#203119" fontSize="7.8" fontWeight="800">
            Cắt trong ngày nay?
          </text>
        </g>

        <g className="marketChatB">
          <rect x="216" y="196" width="118" height="30" rx="15" fill="#b8dc76" />
          <text x="231" y="213" fill="#203119" fontSize="7.2" fontWeight="800">
            <tspan x="231" dy="0">Đã ghi nhật ký</tspan>
            <tspan x="231" dy="8.5">sáng nay.</tspan>
          </text>
        </g>
      </svg>
    </div>
  );
}

export function SystemSection() {
  return (
    <section id="system" className="bg-[#f8f1df] px-5 py-20 text-[#172516] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-[#6f8f45]">Một hệ thống liên thông</p>
          <h2 className="mt-4 text-4xl font-black leading-[0.98] tracking-[-0.05em] sm:text-6xl">
            Từ ban công còn mơ hồ đến mùa thu hoạch có bằng chứng.
          </h2>
        </ScrollReveal>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <ScrollReveal delayMs={0}>
            <FeatureCard
              eyebrow="01 / Trí tuệ không gian"
              title="Quét ban công trước khi chọn cây."
              body="CITYFARM đánh giá ánh sáng, độ sâu sử dụng được và vùng bóng râm, sau đó xếp hạng cây trồng thực sự phù hợp thay vì đưa lời khuyên chung chung."
              note="Demo: tia quét chạy ngang khung ban công, đồng thời các cây phù hợp nhất được đẩy lên và chấm điểm."
            >
              <SpaceIntelligenceDemo />
            </FeatureCard>
          </ScrollReveal>
          <ScrollReveal delayMs={90}>
            <FeatureCard
              eyebrow="02 / Trồng có hướng dẫn"
              title="Biến bộ kit thành kế hoạch chăm cây sống động."
              body="Bộ kit khởi đầu được kích hoạt thành hồ sơ khu vườn thực tế, cung cấp thông tin cây, tiến độ, tác vụ chăm sóc và các mốc kiểm tra sức khỏe ngay từ ngày đầu."
              note="Demo: bộ kit kích hoạt thành cây đang theo dõi, thanh tiến độ tăng dần và các nhắc việc chăm cây xuất hiện theo chu kỳ."
            >
              <GuidedCultivationDemo />
            </FeatureCard>
          </ScrollReveal>
          <ScrollReveal delayMs={180}>
            <FeatureCard
              eyebrow="03 / Chợ địa phương đáng tin"
              title="Bán nông sản bằng bằng chứng, không bằng lời nói suông."
              body="Gian hàng được xây trên lịch sử nhật ký, tín hiệu xác thực người trồng và hội thoại trực tiếp với người mua, để niềm tin đến từ dữ liệu thay vì tuyên bố một chiều."
              note="Demo: các cột mốc nhật ký kích hoạt xác thực, sau đó gian hàng và cuộc trò chuyện với người mua được hiển thị trực quan."
            >
              <TrustedMarketDemo />
            </FeatureCard>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
