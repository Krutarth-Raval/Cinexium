import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';

type SkeletonBlockProps = {
  className?: string;
  circle?: boolean;
  count?: number;
  height?: number | string;
  width?: number | string;
  inline?: boolean;
};

export function Bone({
  className,
  circle,
  count,
  height,
  width,
  inline,
}: SkeletonBlockProps) {
  return (
    <SkeletonTheme baseColor="#1a1d24" highlightColor="#2a2f39">
      <Skeleton
        className={className}
        circle={circle}
        count={count}
        height={height}
        width={width}
        inline={inline}
      />
    </SkeletonTheme>
  );
}

function PageShell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <main className={`min-h-screen ${className}`}>{children}</main>;
}

function PosterRow({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-4 overflow-hidden pr-4 sm:pr-6 lg:pr-8">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="w-[140px] flex-none sm:w-[180px] md:w-[200px] lg:w-[220px]">
          <Bone className="aspect-[2/3] w-full rounded-xl" />
          <Bone className="mt-3" height={18} width="78%" />
          <Bone className="mt-2" height={14} width="52%" />
        </div>
      ))}
    </div>
  );
}

export function HomeBoneyard() {
  return (
    <PageShell className="pb-8">
      <div className="w-full px-4 pt-[104px] pb-6 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[24px] bg-[#16181d] shadow-2xl sm:min-h-[500px] sm:rounded-[32px]">
          <div className="flex min-h-[420px] flex-col justify-end p-5 sm:p-6 lg:p-10">
            <Bone className="mb-4" height={64} width="58%" />
            <Bone className="mb-3" height={24} width="32%" />
            <Bone className="mb-2" height={18} width="84%" />
            <Bone className="mb-6" height={18} width="68%" />
            <div className="flex gap-3">
              <Bone height={48} width={144} />
              <Bone height={48} width={176} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-6 sm:mt-8">
        {Array.from({ length: 4 }).map((_, sectionIndex) => (
          <section key={sectionIndex} className="pl-4 sm:pl-6 lg:pl-8">
            <Bone className="mb-4" height={28} width={220} />
            <PosterRow />
          </section>
        ))}
      </div>
    </PageShell>
  );
}

export function InfiniteGridBoneyard({ title }: { title: string }) {
  return (
    <PageShell className="flex flex-col items-center px-4 pt-24 pb-32 md:px-8">
      <div className="mt-4 mb-8 flex w-full flex-col items-center gap-6 md:flex-row md:justify-between">
        <div className="hidden md:block">
          <Bone height={48} width={220} />
        </div>

        <div className="w-full max-w-3xl md:max-w-xl lg:max-w-3xl">
          <div className="rounded-3xl border border-white/10 bg-[#13161c]/80 p-2 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center">
              <div className="px-4 md:px-6">
                <Bone circle height={22} width={22} />
              </div>
              <Bone height={28} width="100%" />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 flex w-full flex-wrap justify-center gap-3">
        {['All', 'Action', 'Comedy', 'Drama', title].map((label) => (
          <Bone key={label} height={36} width={92 + label.length * 4} />
        ))}
      </div>

      <div className="grid w-full max-w-[1400px] grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 15 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-2">
            <Bone className="aspect-[2/3] w-full rounded-xl" />
            <Bone height={18} width="70%" />
            <Bone height={14} width="45%" />
          </div>
        ))}
      </div>
    </PageShell>
  );
}

export function MediaDetailBoneyard() {
  return (
    <PageShell className="bg-[#0f1115] pb-24">
      <div className="relative w-full bg-[#0f1115] pt-4 md:h-[90vh] md:pt-0">
        <div className="px-4 md:hidden">
          <div className="mb-3 flex items-center gap-3">
            <Bone circle height={40} width={40} />
            <Bone height={34} width="72%" />
          </div>
        </div>

        <div className="relative aspect-video w-full px-4 md:absolute md:inset-0 md:aspect-auto md:px-0">
          <div className="h-full w-full overflow-hidden rounded-2xl bg-[#16181d] md:rounded-none" />
        </div>

        <div className="hidden md:absolute md:top-6 md:left-6 md:block lg:left-10">
          <Bone circle height={48} width={48} />
        </div>

        <div className="hidden lg:absolute lg:right-12 lg:bottom-12 lg:z-30 lg:flex lg:flex-col lg:items-center lg:gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex flex-col items-center gap-2">
              <Bone circle height={28} width={28} />
              <Bone height={12} width={34} />
            </div>
          ))}
        </div>

        <div className="px-4 py-4 md:hidden">
          <Bone className="mb-4" height={16} width="45%" />
          <div className="mb-4 grid grid-cols-1 gap-4">
            <Bone height={54} />
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-xl border border-white/5 bg-[#1a1d24] p-3">
                  <div className="flex flex-col items-center gap-2">
                    <Bone circle height={22} width={22} />
                    <Bone height={12} width={30} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="hidden md:absolute md:inset-0 md:flex md:items-end">
          <div className="w-full px-12 py-12">
            <Bone className="mb-3" height={72} width="46%" />
            <Bone className="mb-4" height={28} width="32%" />
            <div className="flex gap-4">
              <Bone height={56} width={170} />
              <div className="hidden lg:block">
                <Bone height={56} width={240} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-6 grid max-w-[1400px] gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <div className="rounded-[32px] border border-white/5 bg-[#15181e] p-6">
          <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-2xl bg-white/5 p-4">
                <Bone height={14} width="55%" />
                <Bone className="mt-3" height={20} width="80%" />
              </div>
            ))}
          </div>

          <Bone className="mb-4" height={28} width={200} />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Bone key={index} className="aspect-video w-full rounded-2xl" />
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-white/5 bg-[#15181e] p-6">
          <Bone className="mb-4" height={28} width={160} />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Bone circle height={52} width={52} />
                <div className="flex-1">
                  <Bone height={16} width="70%" />
                  <Bone className="mt-2" height={14} width="45%" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export function SettingsPageBoneyard() {
  return (
    <PageShell className="px-4 pt-4 pb-24 md:pt-24">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center gap-4">
          <Bone circle height={40} width={40} />
          <Bone height={34} width={180} />
        </div>

        <div className="space-y-8">
          {Array.from({ length: 3 }).map((_, sectionIndex) => (
            <div key={sectionIndex}>
              <Bone className="mb-3" height={16} width={150} />
              <div className="rounded-2xl border border-white/5 bg-[#1a1d24] shadow-xl">
                {Array.from({ length: 3 }).map((__, rowIndex) => (
                  <div
                    key={rowIndex}
                    className={`flex items-center justify-between gap-4 p-4 ${rowIndex < 2 ? 'border-b border-white/5' : ''}`}
                  >
                    <div className="flex-1">
                      <Bone height={18} width="48%" />
                      <Bone className="mt-2" height={14} width="62%" />
                    </div>
                    <Bone height={32} width={54} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

export function ProfilePageBoneyard() {
  return (
    <PageShell className="px-4 pt-4 pb-24 md:pt-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-2 flex items-center justify-between md:hidden">
          <div className="flex items-center gap-2">
            <Bone circle height={36} width={36} />
            <Bone height={24} width={150} />
          </div>
          <Bone circle height={36} width={36} />
        </div>

        <div className="relative mb-8 md:mb-12">
          <div className="flex flex-col md:grid md:grid-cols-[auto_1fr] md:gap-x-8 md:gap-y-4">
            <div className="mt-2 flex items-center gap-6 px-2 md:mt-0 md:block md:px-0">
              <Bone circle height={160} width={160} className="hidden md:block" />
              <Bone circle height={80} width={80} className="md:hidden" />

              <div className="flex flex-1 justify-between px-4 md:hidden">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="text-center">
                    <Bone height={20} width={28} />
                    <Bone className="mt-2" height={12} width={52} />
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden md:flex md:flex-col md:self-center">
              <Bone className="mb-4" height={36} width={220} />
              <div className="flex gap-8">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index}>
                    <Bone height={20} width={40} />
                    <Bone className="mt-2" height={14} width={72} />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 w-full px-2 md:col-span-2 md:mt-0 md:px-0">
              <div className="mb-6">
                <Bone className="mb-2" height={28} width={180} />
                <Bone height={16} width="64%" />
                <Bone className="mt-2" height={16} width="52%" />
              </div>

              <div className="flex gap-2">
                <Bone height={36} width={118} />
                <Bone height={36} width={118} />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex gap-6 border-b border-white/10 pb-3">
          <Bone height={20} width={120} />
          <Bone height={20} width={120} />
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <Bone className="aspect-[2/3] w-full rounded-xl" />
              <Bone height={16} width="74%" />
              <Bone height={12} width="40%" />
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

export function CollectionPageBoneyard() {
  return (
    <PageShell className="px-4 pt-4 pb-24 md:pt-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 md:hidden">
          <div className="flex justify-center">
            <Bone height={160} width={160} className="rounded-2xl" />
          </div>
          <div className="mt-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <Bone height={30} width={180} />
              <Bone height={24} width={56} />
            </div>
            <Bone className="mx-auto mt-3" height={14} width="60%" />
          </div>
          <div className="mt-4 flex gap-5">
            <Bone height={16} width={58} />
            <Bone height={16} width={42} />
            <Bone height={16} width={42} />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Bone circle height={28} width={28} />
            <Bone height={16} width={120} />
          </div>
          <div className="mt-5 flex gap-2">
            <Bone height={40} width="100%" />
            <Bone height={40} width="100%" />
          </div>
        </div>

        <div className="mb-10 hidden md:block">
          <div className="flex items-start gap-10">
            <Bone height={192} width={192} className="rounded-2xl" />
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-3">
                <Bone height={42} width={240} />
                <Bone height={24} width={56} />
              </div>
              <Bone className="mb-4" height={16} width={70} />
              <div className="mb-6 flex items-center gap-3">
                <Bone circle height={32} width={32} />
                <Bone height={16} width={140} />
              </div>
              <Bone height={16} width="72%" />
              <Bone className="mt-2" height={16} width="54%" />
              <div className="mt-6 flex gap-3">
                <Bone height={42} width={150} />
                <Bone height={42} width={150} />
                <Bone height={42} width={150} />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 h-px w-full bg-white/10" />

        <div className="grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-5 md:gap-4">
          {Array.from({ length: 15 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <Bone className="aspect-[2/3] w-full rounded-xl" />
              <Bone height={14} width="80%" />
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

export function AuthPageBoneyard() {
  return (
    <PageShell className="flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-[32px] border border-white/5 bg-[#15181e] p-8">
        <Bone className="mb-3" height={18} width={120} />
        <Bone className="mb-8" height={40} width="55%" />
        <div className="space-y-4">
          <Bone height={52} />
          <Bone height={52} />
          <Bone height={52} />
        </div>
        <Bone className="mt-6" height={48} />
      </div>
    </PageShell>
  );
}

export function LegalPageBoneyard() {
  return (
    <PageShell className="px-4 pt-[104px] pb-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-[32px] border border-white/5 bg-[#15181e] p-6 lg:p-10">
        <Bone className="mb-3" height={18} width={140} />
        <Bone className="mb-8" height={46} width="44%" />
        <div className="space-y-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index}>
              <Bone className="mb-3" height={24} width={`${55 - index * 4}%`} />
              <Bone height={16} width="100%" />
              <Bone className="mt-2" height={16} width="96%" />
              <Bone className="mt-2" height={16} width="82%" />
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

export function NotificationsPageBoneyard() {
  return (
    <PageShell className="bg-[#0a0a0c] px-4 pt-8 pb-24">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex items-center gap-4">
          <Bone circle height={36} width={36} />
          <Bone height={32} width={150} />
        </div>

        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="relative flex items-start gap-4 rounded-2xl border border-white/5 bg-[#1a1d24] p-4">
              <Bone circle height={48} width={48} />
              <div className="min-w-0 flex-1 pr-6">
                <Bone height={16} width="86%" />
                <Bone className="mt-2" height={14} width="72%" />
                <div className="mt-3 flex gap-2">
                  <Bone height={34} width={92} />
                  <Bone height={34} width={92} />
                </div>
              </div>
              <div className="absolute top-3 right-3">
                <Bone circle height={20} width={20} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

export function SearchPageBoneyard() {
  return (
    <PageShell className="relative overflow-hidden bg-[#0f1115] pt-4 pb-24 md:pt-24 md:pb-0">
      <div className="relative z-40 mx-auto mb-8 w-full max-w-5xl px-4 sm:px-6 md:mt-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Bone circle height={48} width={48} className="md:hidden" />
            <div className="w-full rounded-3xl border border-white/10 bg-[#13161c]/80 p-2 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center">
                <div className="px-4 sm:px-5">
                  <Bone circle height={22} width={22} />
                </div>
                <Bone height={28} width="100%" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-40 mx-auto mt-4 w-full max-w-[820px] px-4 sm:mt-12">
        <Bone className="mx-auto mb-6" height={14} width={170} />
        <div className="grid grid-cols-3 auto-rows-[88px] gap-3 sm:auto-rows-[96px] sm:gap-4">
          <Bone className="col-start-1 row-start-1 row-span-2 rounded-[28px]" />
          <Bone className="col-start-2 row-start-1 col-span-2 rounded-[28px]" />
          <Bone className="col-start-2 row-start-2 rounded-[28px]" />
          <Bone className="col-start-3 row-start-2 rounded-[28px]" />
        </div>
      </div>
    </PageShell>
  );
}

export function PremiumPageBoneyard() {
  return (
    <PageShell className="relative overflow-hidden bg-[#0f1115] px-4 pt-24 pb-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 flex items-center gap-4">
          <Bone circle height={40} width={40} />
          <Bone height={34} width={220} />
        </div>

        <div className="mb-12 text-center">
          <Bone className="mx-auto mb-6" height={56} width="56%" />
          <Bone className="mx-auto" height={18} width="64%" />
        </div>

        <div className="mb-12 flex justify-center">
          <div className="rounded-full border border-white/10 bg-[#1a1d24] p-1">
            <div className="flex gap-1">
              <Bone height={36} width={120} />
              <Bone height={36} width={120} />
            </div>
          </div>
        </div>

        <div className="grid max-w-3xl gap-8 md:mx-auto md:grid-cols-2">
          <div className="rounded-3xl border border-white/5 bg-[#1a1d24]/50 p-8">
            <Bone className="mb-2" height={32} width={90} />
            <Bone className="mb-6" height={14} width="56%" />
            <Bone className="mb-8" height={44} width="48%" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Bone circle height={20} width={20} />
                  <Bone height={16} width="78%" />
                </div>
              ))}
            </div>
            <Bone className="mt-8" height={46} />
          </div>

          <div className="rounded-3xl border border-purple-500/30 bg-[#1a1d24]/80 p-8">
            <Bone className="mb-2" height={32} width={110} />
            <Bone className="mb-6" height={14} width="68%" />
            <Bone className="mb-8" height={44} width="56%" />
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Bone circle height={20} width={20} />
                  <Bone height={16} width="82%" />
                </div>
              ))}
            </div>
            <Bone className="mt-8" height={46} />
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export function PremiumPayBoneyard() {
  return (
    <PageShell className="flex items-center justify-center bg-[#0f1115] px-4 py-10">
      <div className="w-full max-w-lg rounded-[32px] border border-white/10 bg-[#1a1d24] p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <Bone className="mx-auto mb-3" height={14} width={150} />
          <Bone className="mx-auto mb-3" height={40} width="62%" />
          <Bone className="mx-auto mb-2" height={16} width="92%" />
          <Bone className="mx-auto" height={16} width="74%" />
        </div>
        <div className="mb-6 flex flex-col items-center rounded-3xl border border-white/5 bg-[#0f1115] p-5">
          <Bone height={280} width={280} />
          <Bone className="mt-4" height={16} width="70%" />
        </div>
        <div className="mb-6 space-y-3 rounded-3xl border border-white/5 bg-[#0f1115] p-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <Bone height={16} width={100} />
              <Bone height={16} width={140} />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <Bone height={48} />
          <Bone height={48} />
        </div>
      </div>
    </PageShell>
  );
}

function ChatSidebarBoneyard() {
  return (
    <div className="flex h-full min-h-0 flex-col border-r border-white/10 bg-[#15181e] md:w-80 md:gap-4 md:border-r-0 md:bg-transparent lg:w-96">
      <div className="rounded-none border-b border-white/10 bg-[#15181e] p-4 md:rounded-2xl md:border md:border-white/5 md:bg-[#15181e]">
        <div className="mb-4 flex items-center justify-between">
          <Bone height={28} width={110} />
          <Bone circle height={36} width={36} />
        </div>
        <Bone height={46} />
      </div>

      <div className="flex-1 space-y-2 overflow-hidden p-3 md:rounded-2xl md:border md:border-white/5 md:bg-[#15181e] md:p-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 rounded-2xl p-3">
            <Bone circle height={48} width={48} />
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center justify-between gap-3">
                <Bone height={16} width="42%" />
                <Bone height={12} width={34} />
              </div>
              <Bone height={14} width="82%" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatConversationBoneyard() {
  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-[#15181e] md:rounded-2xl md:border md:border-white/5">
      <div className="flex items-center gap-3 border-b border-white/10 bg-[#1a1d24] px-4 py-4">
        <Bone circle height={40} width={40} />
        <div className="flex-1">
          <Bone height={16} width="34%" />
          <Bone className="mt-2" height={12} width="18%" />
        </div>
        <Bone circle height={32} width={32} />
      </div>

      <div className="flex-1 space-y-5 overflow-hidden px-4 py-6">
        {Array.from({ length: 7 }).map((_, index) => {
          const outgoing = index % 3 === 0;
          return (
            <div key={index} className={`flex ${outgoing ? 'justify-end' : 'justify-start'} gap-2`}>
              {!outgoing && <Bone circle height={28} width={28} className="self-end" />}
              <div className={`max-w-[75%] rounded-3xl px-4 py-3 ${outgoing ? 'bg-primary-500/15' : 'bg-white/5'}`}>
                <Bone height={14} width={outgoing ? 180 : 210} />
                <Bone className="mt-2" height={14} width={outgoing ? 140 : 170} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-white/10 bg-[#1a1d24] p-4">
        <Bone height={52} />
      </div>
    </div>
  );
}

export function ChatPageBoneyard({ showSidebar = true, showConversation = true }: { showSidebar?: boolean; showConversation?: boolean }) {
  return (
    <PageShell className="px-0 pt-0 md:px-8 md:pt-24 md:pb-6">
      <div className="fixed inset-0 flex flex-col bg-[#0f1115] md:pt-24 md:px-8 md:pb-6">
        <div className="flex flex-1 overflow-hidden bg-[#15181e] md:gap-4 md:bg-[#0f1115]">
          {showSidebar && (
            <div className={`${showConversation ? 'hidden md:flex' : 'flex'} w-full flex-shrink-0 min-h-0 md:w-80 lg:w-96`}>
              <ChatSidebarBoneyard />
            </div>
          )}

          {showConversation && (
            <div className={`${!showSidebar ? 'flex' : 'hidden md:flex'} min-w-0 flex-1`}>
              <ChatConversationBoneyard />
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
