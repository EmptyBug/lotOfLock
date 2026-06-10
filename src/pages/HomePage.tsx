import { locks } from '../data/locks'
import LockCard from '../components/LockCard'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">자물쇠 시뮬레이터</h1>
      <div className="flex justify-center">
      <div className="grid grid-cols-3 gap-4">
        {locks.map((lock) => (
          <LockCard
            key={lock.id}
            name={lock.name}
            path={lock.path}
            Thumbnail={lock.Thumbnail}
          />
        ))}
      </div>
      </div>
    </div>
  )
}
