function LoadingCarousel() {
  return (
    <section className="py-6 sm:py-8 pl-4 sm:pl-6 lg:pl-8">
      <div className="mb-4 sm:mb-6 h-7 w-48 animate-pulse rounded-full bg-white/10" />
      <div className="flex gap-4 overflow-hidden pr-4 sm:pr-6 lg:pr-8">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="w-[140px] sm:w-[180px] md:w-[200px] lg:w-[220px] flex-none">
            <div className="aspect-[2/3] animate-pulse rounded-xl bg-[#1a1d24]" />
            <div className="mt-2 h-5 w-2/3 animate-pulse rounded-full bg-white/10" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Loading() {
  return (
    <main className="min-h-screen flex flex-col pb-8">
      <div className="w-full px-4 sm:px-6 lg:px-8 mt-[104px] pb-6">
        <div className="relative overflow-hidden rounded-[24px] sm:rounded-[32px] bg-[#16181d] shadow-2xl sm:h-[calc(100vh-128px)] sm:min-h-[500px]">
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#1a1d24] via-[#20242d] to-[#15181e]" />
          <div className="relative z-10 flex h-full min-h-[420px] flex-col justify-end p-5 sm:p-6 lg:p-10">
            <div className="mb-4 h-12 w-3/5 animate-pulse rounded-2xl bg-white/10 sm:h-16" />
            <div className="mb-3 h-6 w-2/5 animate-pulse rounded-full bg-white/10" />
            <div className="mb-6 h-20 max-w-3xl animate-pulse rounded-3xl bg-white/5" />
            <div className="flex gap-3">
              <div className="h-12 w-36 animate-pulse rounded-full bg-white/10" />
              <div className="h-12 w-44 animate-pulse rounded-full bg-white/5" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-4 sm:mt-8">
        <LoadingCarousel />
        <LoadingCarousel />
        <LoadingCarousel />
      </div>
    </main>
  );
}
