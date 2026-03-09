import { useLayoutEffect, useRef } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

interface HelmetProps {
    texturePath: string
    position: [number, number, number]
    index: number
}

export default function ProfessionalHelmet({ texturePath, position, index }: HelmetProps) {
    const { nodes } = useGLTF('/helmetmodel.glb') as any
    const activeTexture = useTexture(texturePath)

    const spinRef = useRef<THREE.Group>(null!)

    useLayoutEffect(() => {
        activeTexture.flipY = false
        activeTexture.colorSpace = THREE.SRGBColorSpace
    }, [activeTexture])

    useFrame((state, _) => {
        if (spinRef.current) {
            const time = state.clock.getElapsedTime();
            spinRef.current.rotation.z = (time * 0.5) + (index * 0.1);
        }
    })

    return (
        <group position={position}>
            <group ref={spinRef} rotation={[-Math.PI / 2, 0, Math.PI]}>
                {nodes.Object_2 && (
                    <mesh geometry={nodes.Object_2.geometry}>
                        <meshStandardMaterial map={activeTexture} roughness={0.4} metalness={0.6} />
                    </mesh>
                )}
                {nodes.Object_4 && (
                    <mesh geometry={nodes.Object_4.geometry}>
                        <meshPhysicalMaterial color="#111" transmission={0.3} />
                    </mesh>
                )}
            </group>
        </group>
    )
}