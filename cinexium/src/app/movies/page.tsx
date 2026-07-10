import { InfiniteMediaGrid } from '@/components/media/InfiniteMediaGrid';
import { cookies } from 'next/headers';

export default async function MoviesPage() {
  const cookieStore = await cookies();
  const region = cookieStore.get('cinexium_region')?.value || 'hollywood';

  return <InfiniteMediaGrid key={region} type="movie" title="Movies" region={region} />;
}
