import { useCallback, useEffect, useState } from 'react'
import { useFrameSequence } from './hooks/useFrameSequence'
import { useReveal } from './hooks/useReveal'
import { useSmoothScroll } from './hooks/useSmoothScroll'
import Preloader from './components/Preloader.jsx'
import Navbar from './components/Navbar.jsx'
import ScrollStage from './components/ScrollStage.jsx'
import FeaturedTimepieces from './components/FeaturedTimepieces.jsx'
import Marquee from './components/Marquee.jsx'
import Maisons from './components/Maisons.jsx'
import Assurances from './components/Assurances.jsx'
import NewCollection from './components/NewCollection.jsx'
import AtelierStage from './components/AtelierStage.jsx'
import Footer from './components/Footer.jsx'

export default function App() {
  const { framesRef, hdRef, progress, ready } = useFrameSequence()
  const [started, setStarted] = useState(false)

  useReveal([started])
  useSmoothScroll(started)

  // Scrolling the stage before the frames exist just shows a black canvas, so
  // the page is held still until the curtain lifts.
  useEffect(() => {
    if (started) return
    const { scrollBehavior } = document.documentElement.style
    document.documentElement.style.scrollBehavior = 'auto'
    window.scrollTo(0, 0)
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.scrollBehavior = scrollBehavior
    }
  }, [started])

  const onDone = useCallback(() => setStarted(true), [])

  return (
    <>
      <Preloader progress={progress} ready={ready} onDone={onDone} />

      <a className="sr-only" href="#featured">
        Skip the scroll sequence
      </a>

      <div id="top" />
      <Navbar />

      <main>
        <ScrollStage framesRef={framesRef} hdRef={hdRef} started={started} />
        <FeaturedTimepieces />
        <Marquee />
        <Maisons />
        <Assurances />
        <NewCollection />
        <AtelierStage />
      </main>

      <Footer />
    </>
  )
}
