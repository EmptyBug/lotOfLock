import { ComponentType } from 'react'
import DialLockThumbnail from '../components/locks/DialLockThumbnail'
import PadlockThumbnail from '../components/locks/PadlockThumbnail'
import NumberLockThumbnail from '../components/locks/NumberLockThumbnail'

export interface LockEntry {
  id: string
  name: string
  path: string
  Thumbnail: ComponentType
}

export const locks: LockEntry[] = [
  {
    id: 'dial',
    name: '다이얼 자물쇠',
    path: '/locks/dial',
    Thumbnail: DialLockThumbnail,
  },
  {
    id: 'padlock',
    name: '열쇠 자물쇠',
    path: '/locks/padlock',
    Thumbnail: PadlockThumbnail,
  },
  {
    id: 'number',
    name: '번호 자물쇠',
    path: '/locks/number',
    Thumbnail: NumberLockThumbnail,
  },
]
