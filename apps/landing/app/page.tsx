import { ScrollReveal } from "./scroll-reveal";
import { SystemSection } from "./system-section";

const journey = [
  "Tải ảnh ban công hoặc góc sân thượng của bạn",
  "Nhận gợi ý cây trồng kèm bản xem trước khu vườn tương lai",
  "Đặt mua hoặc kích hoạt bộ kit trồng phù hợp",
  "Theo dõi lịch chăm, nhật ký và phân tích sức khỏe cây bằng AI",
  "Chia sẻ tiến độ hoặc đăng bán nông sản đã xác thực trong khu vực",
];

const metrics = [
  ["30+", "ngày chăm sóc được ghi nhận để tạo tín hiệu xác thực người trồng"],
  ["3", "lớp kết nối xuyên suốt: khu vườn, thương mại, cộng đồng"],
  ["1", "nguồn dữ liệu thống nhất cho scan, kit, cây, bài đăng và gian hàng"],
];

const useCases = [
  "Người mới trồng ở chung cư chưa biết cây nào hợp không gian thực tế",
  "Gia đình muốn biến ban công và sân thượng thành thói quen ăn sạch mỗi ngày",
  "Người bán địa phương cần bằng chứng nguồn gốc rõ ràng trước khi mở bán",
  "Trường học, văn phòng và khu dân cư đang triển khai chương trình xanh cộng đồng",
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#10170f] text-[#f5f0df]">
      <section className="relative isolate px-5 py-6 sm:px-8 lg:px-12">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,rgba(184,220,118,0.32),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(240,177,78,0.24),transparent_24%),linear-gradient(135deg,#10170f_0%,#172516_52%,#26351f_100%)]" />
        <div className="absolute left-1/2 top-0 -z-10 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full border border-[#f5f0df]/10 bg-[linear-gradient(135deg,rgba(245,240,223,0.08),rgba(245,240,223,0))] blur-sm" />
        <div className="hero-orb hero-orb--a -z-10" />
        <div className="hero-orb hero-orb--b -z-10" />
        <div className="hero-orb hero-orb--c -z-10 hidden sm:block" />

        <nav className="relative z-[1] mx-auto flex max-w-7xl items-center justify-between rounded-full border border-[#f5f0df]/12 bg-[#f5f0df]/8 px-4 py-3 backdrop-blur-md transition hover:border-[#f5f0df]/20">
          <a href="#top" className="flex items-center gap-3" aria-label="Trang chủ CITYFARM">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#b8dc76] text-sm font-black text-[#172516]">
              CF
            </span>
            <span className="text-sm font-semibold tracking-[0.28em] text-[#f5f0df]/80">CITYFARM</span>
          </a>
          <div className="hidden items-center gap-6 text-sm text-[#f5f0df]/70 md:flex">
            <a href="#system" className="transition hover:text-[#f5f0df]">
              Hệ thống
            </a>
            <a href="#journey" className="transition hover:text-[#f5f0df]">
              Hành trình
            </a>
            <a href="#market" className="transition hover:text-[#f5f0df]">
              Chợ địa phương
            </a>
          </div>
          <a
            href="#join"
            className="rounded-full bg-[#f0b14e] px-5 py-2.5 text-sm font-bold text-[#172516] shadow-[0_16px_36px_rgba(240,177,78,0.22)] transition hover:-translate-y-0.5 hover:bg-[#ffd280]"
          >
            Đăng ký dùng thử
          </a>
        </nav>

        <div
          id="top"
          className="relative z-[1] mx-auto grid max-w-7xl gap-10 pb-20 pt-16 lg:grid-cols-[1.04fr_0.96fr] lg:items-center lg:pb-28 lg:pt-24"
        >
          <div className="animate-rise">
            <p className="mb-6 inline-flex rounded-full border border-[#b8dc76]/30 bg-[#b8dc76]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-[#cde89a]">
              Ứng dụng làm vườn đô thị bằng AI
            </p>
            <h1 className="max-w-5xl text-5xl font-black leading-[0.94] tracking-[-0.07em] text-[#fff8df] sm:text-7xl lg:text-8xl">
              Trồng rau sạch ngay tại nhà.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#f5f0df]/72 sm:text-xl">
              CITYFARM giúp cư dân đô thị biết nên trồng gì, hình dung khu vườn trước khi bắt đầu, theo dõi chăm cây thực tế và trao đổi nông sản đã xác thực trong cộng đồng địa phương.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#journey"
                className="rounded-full bg-[#b8dc76] px-7 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-[#172516] transition hover:-translate-y-1 hover:bg-[#d8f49d]"
              >
                Xem quy trình trồng
              </a>
              <a
                href="#system"
                className="rounded-full border border-[#f5f0df]/18 px-7 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-[#f5f0df] transition hover:-translate-y-1 hover:border-[#f5f0df]/44 hover:bg-[#f5f0df]/8"
              >
                Khám phá nền tảng
              </a>
            </div>
          </div>

          <div className="relative animate-rise-delayed">
            <div className="hero-card-aura absolute -inset-5 rounded-[2.5rem] bg-[#f0b14e]/20 blur-3xl" />
            <div className="demo-float relative rounded-[2.25rem] border border-[#f5f0df]/14 bg-[#f5f0df]/10 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="rounded-[1.7rem] bg-[#f8f1df] p-4 text-[#172516]">
                <div className="flex items-center justify-between border-b border-[#172516]/10 pb-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#5b7b3a]">Quét không gian</p>
                    <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">Sân thượng Quận 7</h2>
                  </div>
                  <span className="rounded-full bg-[#172516] px-3 py-1.5 text-xs font-bold text-[#f8f1df]">Độ phù hợp AI 92%</span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
                  <div className="min-h-72 rounded-[1.35rem] bg-[linear-gradient(150deg,#273b26,#7fa859_48%,#f0b14e)] p-4 text-[#fff8df]">
                    <div className="flex h-full flex-col justify-between">
                      <span className="w-fit rounded-full bg-[#10170f]/35 px-3 py-1 text-xs font-bold backdrop-blur">
                        Xem trước vườn tương lai
                      </span>
                      <div>
                        <div className="mb-3 grid grid-cols-3 gap-2">
                          <span className="demo-grow h-16 rounded-t-full bg-[#d8f49d]/90" />
                          <span className="demo-grow h-24 rounded-t-full bg-[#b8dc76]/90 [animation-delay:200ms]" />
                          <span className="demo-grow h-20 rounded-t-full bg-[#f8f1df]/85 [animation-delay:400ms]" />
                        </div>
                        <p className="text-sm font-semibold leading-6 text-[#fff8df]/86">
                          Nắng bán phần, bóng râm từ lan can rõ rệt, đủ độ sâu cho rau gia vị và cây ăn quả cỡ nhỏ.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    {["Húng lủi", "Cà chua bi", "Xà lách"].map((plant, index) => (
                      <div key={plant} className="rounded-[1.1rem] border border-[#172516]/10 bg-white/70 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black">{plant}</span>
                          <span className="text-xs font-bold text-[#5b7b3a]">Hạng {index + 1}</span>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-[#172516]/10">
                          <div
                            className="h-full rounded-full bg-[#5b7b3a]"
                            style={{ width: `${92 - index * 8}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    <div className="rounded-[1.1rem] bg-[#172516] p-4 text-[#f8f1df]">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b8dc76]">Bước tiếp theo</p>
                      <p className="mt-2 text-sm leading-6">Kích hoạt bộ kit rau gia vị ban công và tạo lịch chăm sóc đầu tiên.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SystemSection />

      <section id="journey" className="relative bg-[#172516] px-5 py-20 sm:px-8 lg:px-12">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#b8dc76]/50 to-transparent" />
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <ScrollReveal className="my-auto">
            <p className="text-sm font-black uppercase tracking-[0.28em] text-[#b8dc76]">Hành trình người dùng</p>
            <h2 className="mt-4 text-4xl font-black leading-none tracking-[-0.05em] sm:text-6xl">
              Toàn bộ câu chuyện trồng trọt trong một ứng dụng.
            </h2>
          </ScrollReveal>
          <div className="rounded-[2rem] border border-[#f5f0df]/12 bg-[#f5f0df]/8 p-3">
            {journey.map((step, index) => (
              <ScrollReveal key={step} delayMs={index * 70}>
                <div
                  className={`grid gap-4 px-4 py-5 sm:grid-cols-[4rem_1fr] ${index < journey.length - 1 ? "border-b border-[#f5f0df]/10" : ""}`}
                >
                  <span className="font-mono text-sm text-[#f0b14e]">0{index + 1}</span>
                  <p className="text-xl font-bold tracking-[-0.03em] text-[#fff8df]">{step}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section id="market" className="bg-[#e7dcc3] px-5 py-20 text-[#172516] sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_1fr]">
          <ScrollReveal>
            <div className="rounded-[2.3rem] bg-[#172516] p-8 text-[#f8f1df]">
              <p className="text-sm font-black uppercase tracking-[0.28em] text-[#f0b14e]">Giá trị rõ ràng</p>
              <h2 className="mt-4 text-4xl font-black leading-none tracking-[-0.05em] sm:text-5xl">
                CITYFARM phù hợp với ai?
              </h2>
              <div className="mt-8 grid gap-3">
                {useCases.map((item, i) => (
                  <ScrollReveal key={item} delayMs={i * 60}>
                    <div className="rounded-2xl border border-[#f8f1df]/12 bg-[#f8f1df]/8 p-4 text-sm leading-6 transition hover:border-[#f8f1df]/25">
                      {item}
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </ScrollReveal>
          <div className="grid gap-4">
            {metrics.map(([value, label], i) => (
              <ScrollReveal key={label} delayMs={i * 100}>
                <div className="rounded-[2rem] border border-[#172516]/10 bg-[#f8f1df] p-7 transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(23,37,22,0.08)]">
                  <div className="text-6xl font-black tracking-[-0.08em] text-[#5b7b3a]">{value}</div>
                  <p className="mt-3 max-w-md text-lg font-semibold leading-7 text-[#172516]/74">{label}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section id="join" className="bg-[#10170f] px-5 py-20 sm:px-8 lg:px-12">
        <ScrollReveal>
          <div className="join-cta-shimmer mx-auto max-w-7xl rounded-[2.5rem] border border-[#f5f0df]/12 bg-[linear-gradient(135deg,rgba(245,240,223,0.12),rgba(184,220,118,0.14))] p-8 text-center shadow-[0_30px_100px_rgba(0,0,0,0.28)] sm:p-14">
            <div className="relative z-[1]">
              <p className="text-sm font-black uppercase tracking-[0.28em] text-[#f0b14e]">Thiết kế cho đô thị ăn sạch</p>
              <h2 className="mx-auto mt-5 max-w-4xl text-4xl font-black leading-none tracking-[-0.06em] text-[#fff8df] sm:text-6xl">
                Giúp mọi khu vườn nhỏ trong thành phố dễ bắt đầu, dễ tin tưởng và dễ lan tỏa hơn.
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#f5f0df]/70">
                Dùng CITYFARM để kết nối phân tích không gian bằng AI, thương mại bộ kit, nhật ký chăm cây, trợ lý hướng dẫn và hoạt động chợ địa phương đã xác thực trong một trải nghiệm thống nhất.
              </p>
              <a
                href="mailto:hello@cityfarm.local?subject=CITYFARM%20landing%20access"
                className="mt-9 inline-flex rounded-full bg-[#b8dc76] px-8 py-4 text-sm font-black uppercase tracking-[0.18em] text-[#172516] transition hover:-translate-y-1 hover:bg-[#d8f49d]"
              >
                Bắt đầu chương trình thí điểm
              </a>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </main>
  );
}
