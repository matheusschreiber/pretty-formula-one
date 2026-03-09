import { useRef, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Text } from '@react-three/drei'
import * as THREE from 'three'
import ProfessionalHelmet from "./professional-helmet"

import font from '../assets/Formula1-Regular_web_0.ttf'

import leclerc from '../assets/textures/leclerc.png'
import hamilton from '../assets/textures/hamilton.png'
import verstappen from '../assets/textures/verstappen.png'

const drivers = [
  { id: 'leclerc', tex: leclerc, name: 'Charles Leclerc' },
  { id: 'hamilton', tex: hamilton, name: 'Lewis Hamilton' },
  { id: 'verstappen', tex: verstappen, name: 'Max Verstappen' },
  { id: 'verstappen', tex: verstappen, name: 'Max Verstappen' },
  { id: 'verstappen', tex: verstappen, name: 'Max Verstappen' },
//   { id: 'verstappen', tex: verstappen, name: 'Max Verstappen' },
//   { id: 'verstappen', tex: verstappen, name: 'Max Verstappen' },
//   { id: 'verstappen', tex: verstappen, name: 'Max Verstappen' },
]

function ScrollingGroup() {
  const ref = useRef<THREE.Group>(null!)
  const speed = 5
  const spacing = 10
  const width = drivers.length * spacing

  useFrame((_, delta) => {
    ref.current.position.x -= delta * speed
    if (ref.current.position.x < -width-10) {
      ref.current.position.x = 0-10
    }
  })

  return (
    <group ref={ref}>
      {[...drivers, ...drivers].map((driver, i) => (
        <group key={`${driver.id}-${i}`} position={[i * spacing, 0, 0]}>
          <ProfessionalHelmet 
            texturePath={driver.tex} 
            position={[0, 0, 0]} 
            index={i%drivers.length}
          />
          
          <Text
            position={[0, -4, 0]}
            fontSize={0.8}
            color="white"
            anchorX="center"
            anchorY="middle"
            font={font}
          >
            {driver.name.toUpperCase()}
          </Text>
        </group>
      ))}
    </group>
  )
}

export default function HelmetCarousel() {
  return (
    <div className='lg:w-125 w-full lg:my-0 my-10 h-32'>
      <Canvas camera={{ position: [0, 0, 50], fov: 10 }}>
        <Suspense fallback={null}>
          <Environment preset="city" />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <ScrollingGroup />
        </Suspense>
      </Canvas>
    </div>
  )
}