import { ComponentType } from 'react'
import { useNavigate } from 'react-router-dom'

interface LockCardProps {
  name: string
  path: string
  Thumbnail: ComponentType
}

export default function LockCard({ name, path, Thumbnail }: LockCardProps) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(path)}
      className="flex flex-col items-center bg-white rounded-2xl shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200 p-4 cursor-pointer border border-gray-100"
    >
      <div className="w-16 h-20 mx-auto flex items-center justify-center">
        <Thumbnail />
      </div>
      <span className="mt-3 text-sm font-medium text-gray-700">{name}</span>
    </button>
  )
}
