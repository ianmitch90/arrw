import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Card, CardHeader, CardBody } from '@nextui-org/react';

const ARView = () => {
  return (
    <Card>
      <CardHeader>
        <h1>AR View</h1>
      </CardHeader>
      <CardBody>
        <Canvas>
          {/* @ts-expect-error position prop is valid in @react-three/fiber */}
          <pointLight position={[10, 10, 10]} />

          {/* eslint-disable-next-line react/no-unknown-property */}
          {/* eslint-disable-next-line react/no-unknown-property */}
          <mesh position={[0, -1.5, 0]}>
            {/* eslint-disable-next-line react/no-unknown-property */}
            <boxGeometry attach="geometry" args={[1, 1, 1]} />
            <meshStandardMaterial color="orange" />
          </mesh>

          <OrbitControls />
        </Canvas>
      </CardBody>
    </Card>
  );
};

export default ARView;
