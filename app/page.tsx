import Image from 'next/image'
import Gameboard from '../components/Gameboard'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Gameboard />
    </main>
  )
}
